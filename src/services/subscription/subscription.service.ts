import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubscriptionPlan } from '../../models/entities/subscription/subscription-plan.entity';
import { SubscriptionPlanPrice } from '../../models/entities/subscription/subscription-plan-price.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { SchoolFeatureOverride } from '../../models/entities/entitlement/school-feature-override.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { FeaturePrice } from '../../models/entities/entitlement/feature-price.entity';
import { Order, OrderMetadata } from '../../models/entities/finance/order.entity';
import { Payment } from '../../models/entities/finance/payment.entity';
import { Invoice } from '../../models/entities/finance/invoice.entity';
import { Student } from '../../models/entities/student/student.entity';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { 
  SubscriptionStatusEnum, 
  BillingCycleEnum, 
  OverrideTypeEnum, 
  FeatureBillingCycleEnum,
  AddonTypeEnum,
  OrderStatusEnum,
  PaymentStatusEnum,
  PaymentGatewayEnum,
  OrderItemTypeEnum
} from '../../models/enums/enums';
import { InitiateOrderDto, VerifyPaymentDto } from '../../interfaces/request/subscription/initiate-order.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private dataSource: DataSource,
    private paymentService: PaymentService
  ) {}

  /**
   * Reusable helper to ensure caller manages the target school.
   */
  private async assertOwnership(ownerId: string, schoolId: string) {
    const membership = await this.dataSource.getRepository(SchoolOwnerMember).findOne({
      where: { schoolOwnerId: ownerId, schoolId, isActive: true },
    });
    if (!membership) throw new ForbiddenException('Unauthorized access to this school');
  }

  /**
   * Lists all master plans with their prices and features for the frontend selection popup.
   */
  async listAvailablePlans() {
    const plans = await this.dataSource.getRepository(SubscriptionPlan).find({
      where: { isActive: true, isDeleted: false },
      relations: ['prices', 'featureMappings', 'featureMappings.platformFeature'],
    });

    return {
      plans: plans.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        limits: {
          maxStudents: p.maxStudents,
          maxStaff: p.maxStaff,
          maxClasses: p.maxClasses,
          maxSections: p.maxSections,
        },
        prices: p.prices.filter(pr => pr.isActive).map(pr => ({
          id: pr.id,
          billingCycle: pr.billingCycle,
          price: pr.price,
        })),
        features: p.featureMappings.filter(m => m.isEnabled).map(m => ({
          code: m.platformFeature.code,
          name: m.platformFeature.name,
          limit: m.limitValue,
        }))
      }))
    };
  }


  /**
   * View the complete subscription snapshot including plan limits and active boosters.
   */
  async getSubscriptionSummary(caller: AuthContext, schoolId: string) {
    await this.assertOwnership(caller.id, schoolId);

    const subscription = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId },
      relations: ['subscriptionPlan', 'subscriptionPlan.featureMappings', 'subscriptionPlan.featureMappings.platformFeature']
    });

    if (!subscription) {
      throw new NotFoundException('Subscription record missing for target school');
    }

    const plan = subscription.subscriptionPlan;
    const now = new Date();

    // Query active boosters (Capacity Overrides)
    const activeBoosters = await this.dataSource.getRepository(SchoolFeatureOverride).find({
      where: {
        schoolId,
        overrideType: OverrideTypeEnum.CUSTOM_LIMIT,
        isActive: true,
        isDeleted: false,
      },
    });

    let activeBoosterQuota = 0;
    activeBoosters.forEach((b) => {
      if (b.endDate === null || b.endDate >= now) {
        activeBoosterQuota += parseInt(b.limitValue || '0', 10);
      }
    });

    const effectiveStudentLimit = plan.maxStudents !== null ? plan.maxStudents + activeBoosterQuota : null;

    return {
      summary: {
        schoolId,
        subscriptionState: subscription.subscriptionState,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isTrialExpired: subscription.subscriptionState === SubscriptionStatusEnum.TRIAL && now > subscription.trialEndAt,
        planDetails: {
          name: plan.name,
          code: plan.code,
          featuresIncluded: plan.featureMappings.filter(m => m.isEnabled).map(m => m.platformFeature.code),
          baseLimits: {
            maxStudents: plan.maxStudents,
            maxStaff: plan.maxStaff,
            maxClasses: plan.maxClasses,
            maxSections: plan.maxSections,
          },
        },
        dynamicCapacities: {
          activeBoosterStudentsQuota: activeBoosterQuota,
          effectiveMaxStudentsAllowed: effectiveStudentLimit,
        }
      }
    };
  }


  /**
   * Step 1: Create a local Order and a Razorpay Order.
   */
  async initiateOrder(caller: AuthContext, dto: InitiateOrderDto) {
    await this.assertOwnership(caller.id, dto.schoolId);

    let amount = 0;
    let metadata: OrderMetadata;

    if (dto.planId && dto.billingCycle) {
      const plan = await this.dataSource.getRepository(SubscriptionPlan).findOne({ where: { id: dto.planId } });
      const price = await this.dataSource.getRepository(SubscriptionPlanPrice).findOne({
        where: { subscriptionPlanId: dto.planId, billingCycle: dto.billingCycle }
      });
      if (!plan || !price) throw new BadRequestException('Invalid plan or billing cycle selection');
      
      amount = price.price;
      metadata = { 
        type: OrderItemTypeEnum.PLAN, 
        planId: plan.id, 
        billingCycle: dto.billingCycle, 
        planName: plan.name 
      };
    } 
    else if (dto.featureId && dto.featureBillingCycle) {
      const feature = await this.dataSource.getRepository(PlatformFeature).findOne({ where: { id: dto.featureId } });
      const price = await this.dataSource.getRepository(FeaturePrice).findOne({
        where: { platformFeatureId: dto.featureId, billingCycle: dto.featureBillingCycle }
      });
      if (!feature || !price) throw new BadRequestException('Invalid feature or billing cycle selection');

      amount = price.price;
      metadata = { 
        type: OrderItemTypeEnum.FEATURE, 
        featureId: feature.id, 
        billingCycle: dto.featureBillingCycle, 
        featureName: feature.name 
      };
    }
    else if (dto.addonType) {
      if (dto.addonType === AddonTypeEnum.STUDENT_BOOSTER_50) amount = 500;
      else if (dto.addonType === AddonTypeEnum.STUDENT_BOOSTER_100) amount = 800;
      else throw new BadRequestException('Invalid addon type');
      
      metadata = { 
        type: OrderItemTypeEnum.ADDON, 
        addonType: dto.addonType 
      };
    } 
    else {
      throw new BadRequestException('Either planId or addonType must be provided');
    }

    // Create Local Order
    const order = new Order();
    order.schoolId = dto.schoolId;
    order.schoolOwnerId = caller.id;
    order.amount = amount;
    order.currency = 'INR';
    order.status = OrderStatusEnum.PENDING;
    order.metadata = metadata;

    const savedOrder = await this.dataSource.getRepository(Order).save(order);

    // If amount is 0 (Trial/Free), auto-fulfill immediately
    if (amount === 0) {
      return this.fulfillOrder(savedOrder, 'INTERNAL_FREE_GRANT');
    }

    // Create Razorpay Order
    const rpOrder = await this.paymentService.createRazorpayOrder(amount, savedOrder.id);
    
    savedOrder.razorpayOrderId = rpOrder.id;
    await this.dataSource.getRepository(Order).save(savedOrder);

    return {
      orderId: savedOrder.id,
      razorpayOrderId: rpOrder.id,
      amount: amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_Sq1hvJ0UCpPptT'
    };
  }

  /**
   * Step 2: Verify the payment signature and fulfill the order.
   */
  async verifyPayment(caller: AuthContext, dto: VerifyPaymentDto) {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { razorpayOrderId: dto.razorpayOrderId }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatusEnum.PAID) return { message: 'Order already fulfilled' };

    const isValid = this.paymentService.verifySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature
    );

    if (!isValid) throw new BadRequestException('Invalid payment signature');

    return this.fulfillOrder(order, dto.razorpayPaymentId);
  }

  /**
   * Atomic fulfillment of a paid order.
   */
  private async fulfillOrder(order: Order, razorpayPaymentId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update Order Status
      order.status = OrderStatusEnum.PAID;
      await queryRunner.manager.save(order);

      // 2. Create Payment Record
      const payment = new Payment();
      payment.schoolId = order.schoolId;
      payment.amount = order.amount;
      payment.currency = order.currency;
      payment.paymentGateway = PaymentGatewayEnum.RAZORPAY;
      payment.gatewayPaymentId = razorpayPaymentId;
      payment.paymentState = PaymentStatusEnum.SUCCESS;
      payment.paidAt = new Date();
      payment.metadata = order.metadata;
      await queryRunner.manager.save(payment);

      // 3. Fulfill the specific items
      const { type } = order.metadata;
      const now = new Date();

      if (type === OrderItemTypeEnum.PLAN) {
        const { planId, billingCycle } = order.metadata;
        let subscription = await queryRunner.manager.findOne(SchoolSubscription, {
          where: { schoolId: order.schoolId }
        });

        const months = billingCycle === BillingCycleEnum.YEARLY ? 12 : (billingCycle === BillingCycleEnum.QUARTERLY ? 3 : 1);
        const expiresAt = new Date(now);
        expiresAt.setMonth(now.getMonth() + months);

        if (!subscription) {
          subscription = new SchoolSubscription();
          subscription.schoolId = order.schoolId;
        }

        subscription.subscriptionPlanId = planId!;
        subscription.subscriptionState = SubscriptionStatusEnum.ACTIVE;
        subscription.billingCycle = billingCycle!;
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = expiresAt;
        subscription.isActive = true;

        await queryRunner.manager.save(subscription);
      } 
      else if (type === OrderItemTypeEnum.FEATURE) {
        const { featureId, billingCycle } = order.metadata;
        const months = billingCycle === BillingCycleEnum.YEARLY ? 12 : 1;
        const expiresAt = new Date(now);
        expiresAt.setMonth(now.getMonth() + months);

        const override = new SchoolFeatureOverride();
        override.schoolId = order.schoolId;
        override.platformFeatureId = featureId!;
        override.overrideType = OverrideTypeEnum.ENABLE;
        override.startDate = now;
        override.endDate = expiresAt;
        override.billingCycle = billingCycle === BillingCycleEnum.YEARLY ? FeatureBillingCycleEnum.YEARLY : FeatureBillingCycleEnum.MONTHLY;
        override.isActive = true;

        await queryRunner.manager.save(override);
      }
      else if (type === OrderItemTypeEnum.ADDON) {
        const { addonType } = order.metadata;
        let quota = addonType === AddonTypeEnum.STUDENT_BOOSTER_50 ? 50 : 100;

        const studentFeature = await queryRunner.manager.findOne(PlatformFeature, { where: { code: 'STUDENTS' } });
        if (studentFeature) {
          const override = new SchoolFeatureOverride();
          override.schoolId = order.schoolId;
          override.platformFeatureId = studentFeature.id;
          override.overrideType = OverrideTypeEnum.CUSTOM_LIMIT;
          override.limitValue = quota.toString();
          override.customPrice = order.amount;
          override.billingCycle = FeatureBillingCycleEnum.ONE_TIME;
          override.startDate = now;
          const expiry = new Date(now);
          expiry.setMonth(expiry.getMonth() + 1);
          override.endDate = expiry;
          override.isActive = true;
          await queryRunner.manager.save(override);
        }
      }

      await queryRunner.commitTransaction();
      return { message: 'Payment verified and subscription activated' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Step 3 (Optional): Manually reconcile a PENDING order with Razorpay.
   * Useful for background jobs or admin tools.
   */
  async reconcileOrder(orderId: string) {
    const order = await this.dataSource.getRepository(Order).findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatusEnum.PENDING) return { message: 'Order already processed', status: order.status };
    if (!order.razorpayOrderId) throw new BadRequestException('Order has no Razorpay ID attached');

    // Fetch order status from Razorpay
    const rpOrder = await this.paymentService.getRazorpayOrder(order.razorpayOrderId);
    
    // In Razorpay, 'paid' status on order means fulfillment can happen
    if (rpOrder.status === 'paid') {
      return this.fulfillOrder(order, 'RAZORPAY_RECONCILIATION');
    }

    return { message: 'Order still pending on Razorpay', rpStatus: rpOrder.status };
  }

  /**
   * Returns a complete audit trail of orders and payments for a school.
   */
  async getBillingHistory(schoolId: string) {
    const orders = await this.dataSource.getRepository(Order).find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
      relations: ['payments']
    });

    return { orders };
  }

  /**
   * Returns a list of invoices for the school.
   */
  async listInvoices(schoolId: string) {
    const invoiceRepo = this.dataSource.getRepository(Invoice);
    const invoices = await invoiceRepo.find({
      where: { schoolId },
      order: { createdAt: 'DESC' }
    });
    return { invoices };
  }

  /**
   * Calculates real-time usage against subscription limits.
   */
  async getUsageStats(schoolId: string) {
    const sub = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId },
      relations: ['subscriptionPlan']
    });

    if (!sub) throw new NotFoundException('Subscription not found');

    // 1. Calculate Enrolled Students
    const studentCount = await this.dataSource.getRepository(Student).count({
      where: { schoolId, isActive: true }
    });

    // 2. Fetch Base Limit from Plan + Boosters
    const baseLimit = sub.studentLimit || 0;
    
    // 3. Fetch specific metered features usage from EntitlementService if needed
    // For now, focusing on the core student booster limit

    return {
      subscription: {
        planName: sub.subscriptionPlan?.name || 'Custom',
        status: sub.subscriptionState,
        expiry: sub.currentPeriodEnd
      },
      usage: {
        students: {
          used: studentCount,
          limit: baseLimit,
          remaining: Math.max(0, baseLimit - studentCount),
          utilizationPercentage: baseLimit > 0 ? (studentCount / baseLimit) * 100 : 0
        }
      }
    };
  }
}
