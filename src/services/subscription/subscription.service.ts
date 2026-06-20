import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubscriptionPlan } from '../../models/entities/subscription/subscription-plan.entity';
import { SubscriptionPlanPrice } from '../../models/entities/subscription/subscription-plan-price.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { SchoolFeatureOverride } from '../../models/entities/entitlement/school-feature-override.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { PlatformFeaturePrice } from '../../models/entities/entitlement/plaform-feature-price.entity';
import { SubscriptionPlanPlatformFeatureMapping } from '../../models/entities/entitlement/subscription-plan-platform-feature-mapping.entity';
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
  OrderItemTypeEnum,
  PlanCodeEnum
} from '../../models/enums/enums';
import { InitiateOrderDto, VerifyPaymentDto } from '../../interfaces/request/subscription/initiate-order.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private dataSource: DataSource,
    private paymentService: PaymentService
  ) { }

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
  async listAvailablePlans(caller: AuthContext, schoolId: string) {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    let plans = await this.dataSource.getRepository(SubscriptionPlan).find({
      where: { isActive: true, isDeleted: false },
      relations: ['prices', 'featureMappings', 'featureMappings.platformFeature'],
    });

    await this.assertOwnership(caller.id, schoolId);
    const existingSub = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId }
    });
    if (existingSub) {
      plans = plans.filter(p => p.code !== PlanCodeEnum.TRIAL);
    }

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
        isTrialExpired: subscription.subscriptionState === SubscriptionStatusEnum.TRIAL && !!subscription.trialEndAt && now > subscription.trialEndAt,
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

    // Auto-default Free Trial billing cycle if omitted
    if (dto.planId && !dto.billingCycle) {
      const plan = await this.dataSource.getRepository(SubscriptionPlan).findOne({ where: { id: dto.planId } });
      if (plan && plan.code === PlanCodeEnum.TRIAL) {
        dto.billingCycle = BillingCycleEnum.MONTHLY;
      }
    }

    // Retrieve the active subscription of the school branch
    const subRepo = this.dataSource.getRepository(SchoolSubscription);
    const subscription = await subRepo.findOne({
      where: { schoolId: dto.schoolId, isActive: true },
      relations: ['subscriptionPlan']
    });

    // Block booster/feature purchases for Free Trial schools
    if (!subscription || subscription.subscriptionPlan?.code === PlanCodeEnum.TRIAL) {
      if (dto.addonType || dto.featureId) {
        throw new BadRequestException(
          'Schools on Free Trial are not allowed to purchase boosters/addons. Please upgrade to a paid subscription plan (Basic, Standard, or Premium) first.'
        );
      }
    }

    let amount = 0;
    let metadata: OrderMetadata;

    if (dto.planId && dto.billingCycle) {
      const plan = await this.dataSource.getRepository(SubscriptionPlan).findOne({ where: { id: dto.planId } });
      if (!plan) throw new BadRequestException('Invalid plan selection');

      const isTrial = plan.code === PlanCodeEnum.TRIAL;

      if (isTrial) {
        const existingSub = await subRepo.findOne({ where: { schoolId: dto.schoolId } });
        if (existingSub) {
          throw new BadRequestException('Your school has already used or initiated a Free Trial. You cannot request a Free Trial again.');
        }
        amount = 0;
      } else {
        const price = await this.dataSource.getRepository(SubscriptionPlanPrice).findOne({
          where: { subscriptionPlanId: dto.planId, billingCycle: dto.billingCycle }
        });
        if (!price) throw new BadRequestException('Invalid plan or billing cycle selection');
        amount = price.price;
      }

      metadata = {
        type: OrderItemTypeEnum.PLAN,
        planId: plan.id,
        billingCycle: dto.billingCycle,
        planName: plan.name,
        activationStrategy: 'queue'
      };
    }
    else if (dto.featureId && dto.featureBillingCycle) {
      // Enforce billing cycle alignment (feature cycle must match parent subscription cycle)
      if (subscription && dto.featureBillingCycle !== subscription.billingCycle) {
        throw new BadRequestException(
          `Your individual feature cycle selection (${dto.featureBillingCycle}) must match your active parent subscription cycle (${subscription.billingCycle}).`
        );
      }

      const feature = await this.dataSource.getRepository(PlatformFeature).findOne({ where: { id: dto.featureId } });
      const price = await this.dataSource.getRepository(PlatformFeaturePrice).findOne({
        where: { platformFeatureId: dto.featureId, billingCycle: dto.featureBillingCycle }
      });
      if (!feature || !price) throw new BadRequestException('Invalid feature or billing cycle selection');

      // Dependency Rule: If buying any individual feature except Academic Management, Academic Management MUST be active!
      if (feature.code !== 'ACADEMIC_MANAGEMENT') {
        const isAcademicActive = await this.hasFeatureActive(dto.schoolId, 'ACADEMIC_MANAGEMENT');
        if (!isAcademicActive) {
          throw new BadRequestException(
            `You cannot purchase ${feature.name} individually without having Academic Management active. Please purchase Academic Management first or upgrade to a plan that includes it (Standard/Premium).`
          );
        }
      }

      amount = price.price;
      metadata = {
        type: OrderItemTypeEnum.FEATURE,
        featureId: feature.id,
        billingCycle: dto.featureBillingCycle,
        featureName: feature.name
      };
    }
    else if (dto.addonType) {
      // Dynamically resolve booster pricing based on the parent subscription cycle from the database
      const feature = await this.dataSource.getRepository(PlatformFeature).findOne({ where: { code: dto.addonType } });
      if (!feature) throw new BadRequestException('Invalid addon feature.');

      const price = await this.dataSource.getRepository(PlatformFeaturePrice).findOne({
        where: { platformFeatureId: feature.id, billingCycle: subscription!.billingCycle }
      });
      if (!price) {
        throw new BadRequestException(
          `No booster pricing found for addon ${dto.addonType} under cycle ${subscription!.billingCycle}.`
        );
      }

      amount = price.price;
      metadata = {
        type: OrderItemTypeEnum.ADDON,
        addonType: dto.addonType
      };
    }
    else {
      throw new BadRequestException('Either planId, featureId, or addonType must be provided');
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
      payment.orderId = order.id;
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
        const { planId, billingCycle, activationStrategy } = order.metadata;
        const strategy = activationStrategy || 'queue';

        const plan = await queryRunner.manager.findOne(SubscriptionPlan, { where: { id: planId } });
        if (!plan) throw new BadRequestException('Subscription Plan not found');

        let subscription = await queryRunner.manager.findOne(SchoolSubscription, {
          where: { schoolId: order.schoolId }
        });

        const isTrialPlan = plan.code === PlanCodeEnum.TRIAL;
        const months = isTrialPlan ? 1 : (billingCycle === BillingCycleEnum.YEARLY ? 12 : (billingCycle === BillingCycleEnum.QUARTERLY ? 3 : 1));
        const expiresAt = new Date(now);
        expiresAt.setMonth(now.getMonth() + months);

        if (!subscription) {
          subscription = new SchoolSubscription();
          subscription.schoolId = order.schoolId;
          subscription.subscriptionPlanId = planId!;
          subscription.subscriptionState = isTrialPlan ? SubscriptionStatusEnum.TRIAL : SubscriptionStatusEnum.ACTIVE;
          subscription.billingCycle = billingCycle!;
          if (isTrialPlan) {
            subscription.trialStartAt = now;
            subscription.trialEndAt = expiresAt;
          } else {
            subscription.currentPeriodStart = now;
            subscription.currentPeriodEnd = expiresAt;
          }
          subscription.isActive = true;
          await queryRunner.manager.save(subscription);
        } else {
          const isOngoing = subscription.isActive && subscription.subscriptionState === SubscriptionStatusEnum.ACTIVE && !!subscription.currentPeriodEnd && subscription.currentPeriodEnd > now;

          if (isOngoing && strategy === 'queue') {
            const nextStart = new Date(subscription.currentPeriodEnd || now);
            const nextEnd = new Date(nextStart);
            nextEnd.setMonth(nextStart.getMonth() + months);

            subscription.queuedSubscriptionPlanId = planId!;
            subscription.queuedBillingCycle = billingCycle!;
            subscription.queuedStartDate = nextStart;
            subscription.queuedEndDate = nextEnd;
            subscription.activationStrategy = 'queue';
          } else {
            subscription.subscriptionPlanId = planId!;
            subscription.subscriptionState = isTrialPlan ? SubscriptionStatusEnum.TRIAL : SubscriptionStatusEnum.ACTIVE;
            subscription.billingCycle = billingCycle!;
            if (isTrialPlan) {
              subscription.trialStartAt = now;
              subscription.trialEndAt = expiresAt;
            } else {
              subscription.currentPeriodStart = now;
              subscription.currentPeriodEnd = expiresAt;
              subscription.trialStartAt = null;
              subscription.trialEndAt = null;
            }
            subscription.isActive = true;

            // Clear any old queued state
            subscription.queuedSubscriptionPlanId = null;
            subscription.queuedBillingCycle = null;
            subscription.queuedStartDate = null;
            subscription.queuedEndDate = null;
            subscription.activationStrategy = null;
          }
          await queryRunner.manager.save(subscription);
        }
      }
      else if (type === OrderItemTypeEnum.FEATURE) {
        const { featureId, billingCycle } = order.metadata;
        const months = billingCycle === BillingCycleEnum.YEARLY ? 12 : (billingCycle === BillingCycleEnum.QUARTERLY ? 3 : 1);
        const expiresAt = new Date(now);
        expiresAt.setMonth(now.getMonth() + months);

        const override = new SchoolFeatureOverride();
        override.schoolId = order.schoolId;
        override.platformFeatureId = featureId!;
        override.overrideType = OverrideTypeEnum.ENABLE;
        override.startDate = now;
        override.endDate = expiresAt;

        if (billingCycle === BillingCycleEnum.YEARLY) {
          override.billingCycle = FeatureBillingCycleEnum.YEARLY;
        } else if (billingCycle === BillingCycleEnum.QUARTERLY) {
          override.billingCycle = FeatureBillingCycleEnum.QUARTERLY;
        } else {
          override.billingCycle = FeatureBillingCycleEnum.MONTHLY;
        }
        override.isActive = true;

        // If the platform feature is metered, set the appropriate limit value for the billing cycle length
        const feature = await queryRunner.manager.findOne(PlatformFeature, { where: { id: featureId } });
        if (feature && feature.isMetered) {
          if (feature.code === 'WHATSAPP_REMINDERS') {
            const baseLimit = 1000; // 1,000 free messages per month
            override.limitValue = (baseLimit * months).toString();
          } else {
            override.limitValue = '1000'; // Default limit
          }
          override.overrideType = OverrideTypeEnum.CUSTOM_LIMIT; // Evaluates with limit limits inside evaluateFeatureAccess
        }

        await queryRunner.manager.save(override);
      }
      else if (type === OrderItemTypeEnum.ADDON) {
        const { addonType } = order.metadata;

        const boosterFeature = await queryRunner.manager.findOne(PlatformFeature, { where: { code: addonType } });
        if (!boosterFeature) throw new NotFoundException(`Booster feature ${addonType} not found`);

        const limitValue = boosterFeature.defaultLimit || '0';

        if (addonType === AddonTypeEnum.STUDENT_BOOSTER_SMALL || addonType === AddonTypeEnum.STUDENT_BOOSTER_MEDIUM) {
          const studentFeature = await queryRunner.manager.findOne(PlatformFeature, { where: { code: 'STUDENT_MANAGEMENT' } });
          if (studentFeature) {
            const override = new SchoolFeatureOverride();
            override.schoolId = order.schoolId;
            override.platformFeatureId = studentFeature.id;
            override.overrideType = OverrideTypeEnum.CUSTOM_LIMIT;
            override.limitValue = limitValue;
            override.customPrice = order.amount;
            override.billingCycle = FeatureBillingCycleEnum.ONE_TIME;
            override.startDate = now;
            override.endDate = null;
            override.isActive = true;
            await queryRunner.manager.save(override);
          }
        }
        else if (addonType === AddonTypeEnum.WHATSAPP_BOOSTER_SMALL || addonType === AddonTypeEnum.WHATSAPP_BOOSTER_MEDIUM) {
          const whatsappFeature = await queryRunner.manager.findOne(PlatformFeature, { where: { code: 'WHATSAPP_REMINDERS' } });
          if (whatsappFeature) {
            const override = new SchoolFeatureOverride();
            override.schoolId = order.schoolId;
            override.platformFeatureId = whatsappFeature.id;
            override.overrideType = OverrideTypeEnum.CUSTOM_LIMIT;
            override.limitValue = limitValue;
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

    // 2. Fetch Active Student Booster Overrides
    const overridesRepo = this.dataSource.getRepository(SchoolFeatureOverride);
    const now = new Date();
    const activeStudentOverrides = await overridesRepo.find({
      where: { schoolId, isActive: true },
    });

    const activeLimitOverrides = activeStudentOverrides.filter((o) => {
      const started = !o.startDate || o.startDate <= now;
      const unexpired = !o.endDate || o.endDate >= now;
      return !o.isDeleted && started && unexpired;
    });

    const studentFeature = await this.dataSource.getRepository(PlatformFeature).findOne({ where: { code: 'STUDENT_MANAGEMENT' } });
    let studentBoosterSum = 0;
    if (studentFeature) {
      const studentLimitOverrides = activeLimitOverrides.filter(o => o.platformFeatureId === studentFeature.id && o.overrideType === OverrideTypeEnum.CUSTOM_LIMIT);
      for (const o of studentLimitOverrides) {
        if (o.limitValue) {
          studentBoosterSum += parseInt(o.limitValue, 10);
        }
      }
    }

    const baseLimit = sub.subscriptionPlan?.maxStudents || 0;
    const totalStudentLimit = baseLimit + studentBoosterSum;

    return {
      subscription: {
        planName: sub.subscriptionPlan?.name || 'Custom',
        status: sub.subscriptionState,
        expiry: sub.currentPeriodEnd
      },
      usage: {
        students: {
          used: studentCount,
          limit: totalStudentLimit,
          remaining: Math.max(0, totalStudentLimit - studentCount),
          utilizationPercentage: totalStudentLimit > 0 ? (studentCount / totalStudentLimit) * 100 : 0
        }
      }
    };
  }

  private async hasFeatureActive(schoolId: string, featureCode: string): Promise<boolean> {
    const feature = await this.dataSource.getRepository(PlatformFeature).findOne({ where: { code: featureCode } });
    if (!feature) return false;

    // 1. Check active overrides
    const override = await this.dataSource.getRepository(SchoolFeatureOverride).findOne({
      where: { schoolId, platformFeatureId: feature.id, isActive: true }
    });
    const now = new Date();
    if (override) {
      const started = !override.startDate || override.startDate <= now;
      const unexpired = !override.endDate || override.endDate >= now;
      if (started && unexpired) {
        return override.overrideType !== OverrideTypeEnum.DISABLE && override.isEnabled;
      }
    }

    // 2. Check Plan Baseline
    const sub = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId: schoolId, isActive: true },
      relations: ['subscriptionPlan']
    });
    if (!sub) return false;

    await this.promoteQueuedPlanIfApplicable(sub);

    const mapping = await this.dataSource.getRepository(SubscriptionPlanPlatformFeatureMapping).findOne({
      where: { subscriptionPlanId: sub.subscriptionPlanId, platformFeatureId: feature.id, isActive: true }
    });
    return mapping?.isEnabled ?? false;
  }

  /**
   * Get the active plan, feature-wise purchases, and boosters status with remaining days.
   */
  async getActiveItemsStatus(caller: AuthContext, schoolId: string) {
    await this.assertOwnership(caller.id, schoolId);

    const now = new Date();

    // 1. Fetch Subscription
    const subscription = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId },
      relations: ['subscriptionPlan'],
    });

    if (subscription) {
      await this.promoteQueuedPlanIfApplicable(subscription);
    }

    // 2. Fetch Active Overrides (Features & Boosters)
    const overrides = await this.dataSource.getRepository(SchoolFeatureOverride).find({
      where: { schoolId, isActive: true, isDeleted: false },
    });

    // 3. Fetch Platform Features to map names and codes in memory
    const platformFeatures = await this.dataSource.getRepository(PlatformFeature).find({
      where: { isActive: true },
    });
    const featureMap = new Map(platformFeatures.map(f => [f.id, f]));

    let activePlan: any = null;
    if (subscription) {
      const expiresAt = subscription.subscriptionState === SubscriptionStatusEnum.TRIAL ? subscription.trialEndAt : subscription.currentPeriodEnd;
      const isExpired = expiresAt ? expiresAt < now : false;
      const timeDiff = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
      const daysRemaining = expiresAt ? Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))) : 0;
      const hoursRemaining = expiresAt ? Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60))) : 0;

      activePlan = {
        name: subscription.subscriptionPlan?.name || 'Custom Plan',
        code: subscription.subscriptionPlan?.code || 'CUSTOM',
        status: subscription.subscriptionState,
        expiresAt,
        daysRemaining: isExpired ? 0 : daysRemaining,
        hoursRemaining: isExpired ? 0 : hoursRemaining,
        isExpired,
      };
    }

    const activeFeatures: any[] = [];
    const activeBoosters: any[] = [];

    overrides.forEach(o => {
      // Check if override is active (within valid date range)
      const isWithinDate = (!o.startDate || o.startDate <= now) && (!o.endDate || o.endDate >= now);
      if (!isWithinDate) return;

      const feature = featureMap.get(o.platformFeatureId);
      const expiresAt = o.endDate;
      const timeDiff = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
      const daysRemaining = expiresAt ? Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))) : 0;
      const hoursRemaining = expiresAt ? Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60))) : 0;

      // Classify as dynamic feature purchase or capacity booster addon
      const isBooster = o.billingCycle === 'ONE_TIME' || (o.overrideType === OverrideTypeEnum.CUSTOM_LIMIT && (feature?.code?.includes('BOOSTER') || o.limitValue));

      const itemDetails = {
        id: o.id,
        name: feature?.name || 'Custom Feature',
        code: feature?.code || 'CUSTOM',
        expiresAt,
        daysRemaining,
        hoursRemaining,
        isExpired: false,
      };

      if (isBooster) {
        activeBoosters.push({
          ...itemDetails,
          limitQuota: o.limitValue || '0',
        });
      } else {
        activeFeatures.push({
          ...itemDetails,
          billingCycle: o.billingCycle,
        });
      }
    });

    return {
      activePlan,
      activeFeatures,
      activeBoosters,
    };
  }

  /**
   * JIT activation promotion logic.
   * If the queued plan start date has arrived, it automatically elevates the queued plan to active.
   */
  private async promoteQueuedPlanIfApplicable(subscription: SchoolSubscription) {
    if (subscription.queuedSubscriptionPlanId && subscription.queuedStartDate) {
      const now = new Date();
      if (now >= subscription.queuedStartDate) {
        subscription.subscriptionPlanId = subscription.queuedSubscriptionPlanId;
        subscription.subscriptionState = SubscriptionStatusEnum.ACTIVE;
        subscription.billingCycle = subscription.queuedBillingCycle!;
        subscription.currentPeriodStart = subscription.queuedStartDate;
        subscription.currentPeriodEnd = subscription.queuedEndDate!;

        subscription.trialStartAt = null;
        subscription.trialEndAt = null;

        subscription.queuedSubscriptionPlanId = null;
        subscription.queuedBillingCycle = null;
        subscription.queuedStartDate = null;
        subscription.queuedEndDate = null;
        subscription.activationStrategy = null;

        await this.dataSource.getRepository(SchoolSubscription).save(subscription);
      }
    }
  }

  /**
   * Update the activation strategy of a queued subscription plan.
   */
  async updateQueuedActivationStrategy(caller: AuthContext, schoolId: string, strategy: 'immediate' | 'parallel') {
    await this.assertOwnership(caller.id, schoolId);

    const subscription = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId },
      relations: ['subscriptionPlan']
    });

    if (!subscription || !subscription.queuedSubscriptionPlanId) {
      throw new BadRequestException('No queued subscription plan found for this school context. Once a plan has started, its strategy cannot be changed.');
    }

    const now = new Date();

    if (strategy === 'immediate' || strategy === 'parallel') {
      const queuedPlan = await this.dataSource.getRepository(SubscriptionPlan).findOne({
        where: { id: subscription.queuedSubscriptionPlanId }
      });
      if (!queuedPlan) throw new NotFoundException('Queued plan not found');

      const isTrialPlan = queuedPlan.code === PlanCodeEnum.TRIAL;
      const months = isTrialPlan ? 1 : (subscription.queuedBillingCycle === BillingCycleEnum.YEARLY ? 12 : (subscription.queuedBillingCycle === BillingCycleEnum.QUARTERLY ? 3 : 1));
      const expiresAt = new Date(now);
      expiresAt.setMonth(now.getMonth() + months);

      subscription.subscriptionPlanId = subscription.queuedSubscriptionPlanId;
      subscription.subscriptionState = isTrialPlan ? SubscriptionStatusEnum.TRIAL : SubscriptionStatusEnum.ACTIVE;
      subscription.billingCycle = subscription.queuedBillingCycle!;
      if (isTrialPlan) {
        subscription.trialStartAt = now;
        subscription.trialEndAt = expiresAt;
      } else {
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = expiresAt;
        subscription.trialStartAt = null;
        subscription.trialEndAt = null;
      }

      // Clear the queue
      subscription.queuedSubscriptionPlanId = null;
      subscription.queuedBillingCycle = null;
      subscription.queuedStartDate = null;
      subscription.queuedEndDate = null;
      subscription.activationStrategy = null;

      await this.dataSource.getRepository(SchoolSubscription).save(subscription);

      return {
        message: `Subscription activated ${strategy === 'parallel' ? 'concurrently in parallel' : 'immediately'}!`,
        activePlanName: queuedPlan.name,
        expiresAt,
      };
    } else {
      throw new BadRequestException('Invalid activation strategy transition. Must be immediate or parallel.');
    }
  }
}
