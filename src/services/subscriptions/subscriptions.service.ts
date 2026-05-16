import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchoolOwnerMember } from '../../models/entities/school/school_owner_members.entity';
import { SubscriptionPlan } from '../../models/entities/subscription/subscription-plan.entity';
import { PlanPrice } from '../../models/entities/subscription/subscription-plan-price.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SchoolFeatureOverride } from '../../models/entities/entitlement/school-feature-override.entity';
import { SubscriptionPlanPlatformFeatureMapping } from '../../models/entities/entitlement/subscription-plan-platform-feature-mapping.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import {
  PlanCodeEnum,
  BillingCycleEnum,
  SubscriptionStatusEnum,
  AddonTypeEnum,
  OverrideTypeEnum,
  FeatureBillingCycleEnum,
} from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { UpgradePlanDto } from '../../interfaces/request/subscription/upgrade-plan.dto';
import { PurchaseAddonDto } from '../../interfaces/request/subscription/purchase-addon.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private dataSource: DataSource) { }

  /**
   * Asserts caller ownership of target school.
   */
  private async assertOwnership(ownerId: string, schoolId: string): Promise<void> {
    const member = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });

    if (!member) {
      throw new ForbiddenException('You lack authorization to manage subscription profiles for this school');
    }
  }

  /**
   * Pre-seeds standard customizable pricing data if absent in the DB.
   */
  private async ensurePlanPricesExist(subscriptionPlanId: string, planCode: PlanCodeEnum): Promise<void> {
    const priceRepo = this.dataSource.getRepository(PlanPrice);
    const existing = await priceRepo.findOne({ where: { subscriptionPlanId } });

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
        p.subscriptionPlanId = subscriptionPlanId;
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
      where: { id: subscription.subscriptionPlanId },
    });

    if (!plan) {
      throw new NotFoundException('Subscribed base plan tier not found');
    }

    const now = new Date();

    // Query dynamically calculated active boosters from Overrides
    const activeBoosters = await this.dataSource.getRepository(SchoolFeatureOverride).find({
      where: {
        schoolId,
        overrideType: OverrideTypeEnum.CUSTOM_LIMIT,
        isActive: true,
        isDeleted: false,
      },
    });

    // Sum up limit values (Boosters are additive to base limit in this logic)
    let activeBoosterQuota = 0;
    activeBoosters.forEach((b) => {
      if (b.endDate === null || b.endDate >= now) {
        activeBoosterQuota += parseInt(b.limitValue || '0', 10);
      }
    });

    const baseStudentLimit = plan.maxStudents;
    const effectiveStudentLimit = baseStudentLimit !== null ? baseStudentLimit + activeBoosterQuota : null;

    // Fetch historical booster ledger (all custom limit overrides)
    const boosterPacks = activeBoosters;

    // Look up enabled features natively mapped to this global plan via the Entitlement architecture
    const planFeatures = await this.dataSource
      .getRepository(SubscriptionPlanPlatformFeatureMapping)
      .find({ where: { subscriptionPlanId: plan.id, isEnabled: true } });

    const platformFeatureIds = planFeatures.map((pf) => pf.platformFeatureId);
    let featuresIncluded: string[] = [];

    if (platformFeatureIds.length > 0) {
      const platformFeatures = await this.dataSource
        .getRepository(PlatformFeature)
        .createQueryBuilder('pf')
        .where('pf.id IN (:...platformFeatureIds)', { platformFeatureIds })
        .getMany();
      featuresIncluded = platformFeatures.map((pf) => pf.code);
    }

    return {
      summary: {
        schoolId,
        subscriptionState: subscription.subscriptionState,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isTrialExpired:
          subscription.subscriptionState === SubscriptionStatusEnum.TRIAL &&
          subscription.trialEndAt &&
          now > subscription.trialEndAt,
        planDetails: {
          code: plan.code,
          name: plan.name,
          featuresIncluded,
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
      where: { subscriptionPlanId: targetPlan.id, billingCycle: dto.billingCycle },
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

    subscription.subscriptionPlanId = targetPlan.id;
    subscription.billingCycle = dto.billingCycle;
    subscription.subscriptionState = SubscriptionStatusEnum.ACTIVE;
    subscription.currentPeriodStart = periodStart;
    subscription.currentPeriodEnd = periodEnd;

    await subRepo.save(subscription);

    return {
      message: `Successfully upgraded school subscription to '${targetPlan.name}' (${dto.billingCycle})`,
      amountBilled: planPrice.price,
      subscriptionDetails: {
        subscriptionState: subscription.subscriptionState,
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
    expiry.setMonth(expiry.getMonth() + 1);

    // Find the feature ID for "STUDENTS"
    const studentFeature = await this.dataSource.getRepository(PlatformFeature).findOne({
      where: { code: 'STUDENTS' }
    });

    if (!studentFeature) {
      throw new NotFoundException('Student Limit feature configuration missing');
    }

    const override = new SchoolFeatureOverride();
    override.schoolId = schoolId;
    override.platformFeatureId = studentFeature.id;
    override.overrideType = OverrideTypeEnum.CUSTOM_LIMIT;
    override.limitValue = quotaGranted.toString();
    override.customPrice = amountCharged;
    override.billingCycle = FeatureBillingCycleEnum.ONE_TIME;
    override.startDate = now;
    override.endDate = expiry;
    override.remarks = `Purchased Booster: ${dto.addonType}`;
    override.isActive = true;

    const savedOverride = await this.dataSource.getRepository(SchoolFeatureOverride).save(override);

    return {
      message: `Capacity booster purchased successfully (+${quotaGranted} students)`,
      boosterDetails: {
        id: savedOverride.id,
        addonType: dto.addonType,
        quotaAdded: quotaGranted,
        priceBilled: amountCharged,
        validUntil: savedOverride.endDate,
      },
    };
  }
}
