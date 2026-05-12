import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchoolMember } from '../../models/entities/school/school-member.entity';
import { SubscriptionPlan } from '../../models/entities/subscription/subscription-plan.entity';
import { PlanPrice } from '../../models/entities/subscription/plan-price.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SchoolAddon } from '../../models/entities/subscription/school-addon.entity';
import {
  PlanCodeEnum,
  BillingCycleEnum,
  SubscriptionStatusEnum,
  AddonTypeEnum,
} from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { UpgradePlanDto } from '../../interfaces/request/subscription/upgrade-plan.dto';
import { PurchaseAddonDto } from '../../interfaces/request/subscription/purchase-addon.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private dataSource: DataSource) {}

  /**
   * Asserts caller ownership of target school.
   */
  private async assertOwnership(ownerId: string, schoolId: string): Promise<void> {
    const member = await this.dataSource
      .getRepository(SchoolMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });

    if (!member) {
      throw new ForbiddenException('You lack authorization to manage subscription profiles for this school');
    }
  }

  /**
   * Pre-seeds standard customizable pricing data if absent in the DB.
   */
  private async ensurePlanPricesExist(planId: string, planCode: PlanCodeEnum): Promise<void> {
    const priceRepo = this.dataSource.getRepository(PlanPrice);
    const existing = await priceRepo.findOne({ where: { planId } });

    if (!existing && planCode !== PlanCodeEnum.TRIAL) {
      const pricingMap: Record<PlanCodeEnum, Record<BillingCycleEnum, number>> = {
        [PlanCodeEnum.TRIAL]: { monthly: 0, quarterly: 0, yearly: 0 },
        [PlanCodeEnum.BASIC]: {
          [BillingCycleEnum.MONTHLY]: 1500,
          [BillingCycleEnum.QUARTERLY]: 4000,
          [BillingCycleEnum.YEARLY]: 16500,
        },
        [PlanCodeEnum.STANDARD]: {
          [BillingCycleEnum.MONTHLY]: 3000,
          [BillingCycleEnum.QUARTERLY]: 8000,
          [BillingCycleEnum.YEARLY]: 33000,
        },
        [PlanCodeEnum.PREMIUM]: {
          [BillingCycleEnum.MONTHLY]: 5000,
          [BillingCycleEnum.QUARTERLY]: 13500,
          [BillingCycleEnum.YEARLY]: 55000,
        },
      };

      const cycles = [BillingCycleEnum.MONTHLY, BillingCycleEnum.QUARTERLY, BillingCycleEnum.YEARLY];
      for (const c of cycles) {
        const p = new PlanPrice();
        p.planId = planId;
        p.billingCycle = c;
        p.price = pricingMap[planCode]?.[c] || 0;
        await priceRepo.save(p);
      }
    }
  }

  /**
   * View complete subscription profile, limits, features, and active dynamic capacity boosters.
   */
  async getSubscriptionSummary(caller: AuthContext, schoolId: string) {
    await this.assertOwnership(caller.id, schoolId);

    const subscription = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription record missing for target school');
    }

    const plan = await this.dataSource.getRepository(SubscriptionPlan).findOne({
      where: { id: subscription.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscribed base plan tier not found');
    }

    const now = new Date();

    // Query dynamically calculated active add-on capacities
    const activeAddonsSum = await this.dataSource
      .getRepository(SchoolAddon)
      .createQueryBuilder('addon')
      .select('SUM(addon.quota)', 'total')
      .where('addon.schoolId = :schoolId', { schoolId })
      .andWhere('addon.status = :status', { status: 'active' })
      .andWhere('addon.endAt >= :now', { now })
      .getRawOne();

    const activeBoosterQuota = parseInt(activeAddonsSum?.total || '0', 10);
    const baseStudentLimit = plan.maxStudents;
    const effectiveStudentLimit = baseStudentLimit !== null ? baseStudentLimit + activeBoosterQuota : null;

    // Fetch complete historical booster ledger
    const boosterPacks = await this.dataSource.getRepository(SchoolAddon).find({
      where: { schoolId },
      order: { createdAt: 'DESC' },
    });

    return {
      summary: {
        schoolId,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isTrialExpired:
          subscription.status === SubscriptionStatusEnum.TRIAL &&
          subscription.trialEndAt &&
          now > subscription.trialEndAt,
        planDetails: {
          code: plan.code,
          name: plan.name,
          featuresIncluded: plan.features,
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
        },
        boosterLedger: boosterPacks,
      },
    };
  }

  /**
   * Upgrade base subscription tier and renewal billing cycle.
   */
  async upgradePlan(caller: AuthContext, schoolId: string, dto: UpgradePlanDto) {
    await this.assertOwnership(caller.id, schoolId);

    const targetPlan = await this.dataSource.getRepository(SubscriptionPlan).findOne({
      where: { code: dto.planCode },
    });

    if (!targetPlan) {
      throw new BadRequestException(`Target plan tier '${dto.planCode}' is not configured`);
    }

    await this.ensurePlanPricesExist(targetPlan.id, targetPlan.code);

    const planPrice = await this.dataSource.getRepository(PlanPrice).findOne({
      where: { planId: targetPlan.id, billingCycle: dto.billingCycle },
    });

    if (!planPrice) {
      throw new BadRequestException(`Pricing for cycle '${dto.billingCycle}' is unavailable`);
    }

    const subRepo = this.dataSource.getRepository(SchoolSubscription);
    const subscription = await subRepo.findOne({ where: { schoolId } });

    if (!subscription) {
      throw new NotFoundException('Active school subscription profile missing');
    }

    const now = new Date();
    const periodStart = now;
    let periodEnd = new Date(now);

    if (dto.billingCycle === BillingCycleEnum.MONTHLY) {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (dto.billingCycle === BillingCycleEnum.QUARTERLY) {
      periodEnd.setMonth(periodEnd.getMonth() + 3);
    } else if (dto.billingCycle === BillingCycleEnum.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    subscription.planId = targetPlan.id;
    subscription.billingCycle = dto.billingCycle;
    subscription.status = SubscriptionStatusEnum.ACTIVE;
    subscription.currentPeriodStart = periodStart;
    subscription.currentPeriodEnd = periodEnd;

    await subRepo.save(subscription);

    return {
      message: `Successfully upgraded school subscription to '${targetPlan.name}' (${dto.billingCycle})`,
      amountBilled: planPrice.price,
      subscriptionDetails: {
        status: subscription.status,
        planName: targetPlan.name,
        billingCycle: subscription.billingCycle,
        renewingAt: subscription.currentPeriodEnd,
      },
    };
  }

  /**
   * Process standalone purchase for highly granular booster packages.
   * Ensures independent lifecycles starting instantly and ending exactly +1 month later.
   */
  async purchaseAddon(caller: AuthContext, schoolId: string, dto: PurchaseAddonDto) {
    await this.assertOwnership(caller.id, schoolId);

    const subscription = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId },
    });

    if (!subscription) {
      throw new NotFoundException('Active school subscription profile missing');
    }

    let quotaGranted = 0;
    let amountCharged = 0;

    if (dto.addonType === AddonTypeEnum.STUDENT_BOOSTER_50) {
      quotaGranted = 50;
      amountCharged = 500.00;
    } else if (dto.addonType === AddonTypeEnum.STUDENT_BOOSTER_100) {
      quotaGranted = 100;
      amountCharged = 800.00; // Directly enforces bulk pricing discount tier
    } else {
      throw new BadRequestException('Invalid booster type selected');
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + 1); // Exact independent 1-month lifecycle

    const addon = new SchoolAddon();
    addon.schoolId = schoolId;
    addon.addonType = dto.addonType;
    addon.quota = quotaGranted;
    addon.pricePaid = amountCharged;
    addon.status = 'active';
    addon.startAt = now;
    addon.endAt = expiry;

    const savedAddon = await this.dataSource.getRepository(SchoolAddon).save(addon);

    return {
      message: `Capacity booster purchased successfully (+${quotaGranted} students)`,
      boosterDetails: {
        id: savedAddon.id,
        addonType: savedAddon.addonType,
        quotaAdded: savedAddon.quota,
        priceBilled: savedAddon.pricePaid,
        validUntil: savedAddon.endAt,
      },
    };
  }
}
