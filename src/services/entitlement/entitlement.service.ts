import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { SubscriptionPlanPlatformFeatureMapping } from '../../models/entities/entitlement/subscription-plan-platform-feature-mapping.entity';
import { SchoolFeatureOverride } from '../../models/entities/entitlement/school-feature-override.entity';
import { FeatureUsageLog } from '../../models/entities/entitlement/feature-usage-log.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { OverrideTypeEnum } from '../../models/enums/enums';

@Injectable()
export class EntitlementService {
  constructor(private dataSource: DataSource) {}

  /**
   * Production-grade engine evaluating granular tenant entitlements.
   * Enforces business rule: School overrides always take precedence over global plan baselines.
   */
  async evaluateFeatureAccess(schoolId: string, featureCode: string) {
    const featureRepo = this.dataSource.getRepository(PlatformFeature);
    const feature = await featureRepo.findOne({ where: { code: featureCode } });

    if (!feature) {
      throw new NotFoundException(`Platform feature capability '${featureCode}' is unrecognized`);
    }

    if (!feature.isActive) {
      return {
        isAllowed: false,
        featureDetails: { code: feature.code, name: feature.name, usageUnit: feature.usageUnit },
        reason: 'FeatureGloballyDeactivated',
      };
    }

    // Identify active subscription profile
    const subRepo = this.dataSource.getRepository(SchoolSubscription);
    const subscription = await subRepo.findOne({ where: { schoolId } });

    if (!subscription) {
      return {
        isAllowed: false,
        featureDetails: { code: feature.code, name: feature.name, usageUnit: feature.usageUnit },
        reason: 'NoActiveSubscriptionTierFound',
      };
    }

    // Expiry Check
    const now = new Date();
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      return {
        isAllowed: false,
        featureDetails: { code: feature.code, name: feature.name, usageUnit: feature.usageUnit },
        reason: 'SubscriptionExpired',
      };
    }

    // Retrieve global plan feature baseline configuration
    const planFeatureRepo = this.dataSource.getRepository(SubscriptionPlanPlatformFeatureMapping);
    const planFeature = await planFeatureRepo.findOne({
      where: { subscriptionPlanId: subscription.subscriptionPlanId, platformFeatureId: feature.id },
    });

    // Retrieve per-school specific override priority rules
    const overrideRepo = this.dataSource.getRepository(SchoolFeatureOverride);
    const overrides = await overrideRepo.find({
      where: { schoolId, platformFeatureId: feature.id },
      order: { createdAt: 'DESC' },
    });

    // Check if an unexpired active override governs execution
    const activeOverride = overrides.find((o) => {
      const started = !o.startDate || o.startDate <= now;
      const unexpired = !o.endDate || o.endDate >= now;
      return started && unexpired;
    });

    // Precedence rule application
    let isEnabled = planFeature?.isEnabled ?? false;
    let quotaLimitStr = planFeature?.limitValue ?? null;
    let appliedRuleType = 'GlobalPlanBaseline';

    if (activeOverride) {
      appliedRuleType = `TenantOverride:${activeOverride.overrideType}`;
      if (activeOverride.overrideType === OverrideTypeEnum.DISABLE || !activeOverride.isEnabled) {
        isEnabled = false;
      } else {
        isEnabled = true;
      }

      // If override provides a specific quota ceiling, apply it
      if (activeOverride.limitValue !== null) {
        quotaLimitStr = activeOverride.limitValue;
      }
    }

    if (!isEnabled) {
      return {
        isAllowed: false,
        featureDetails: { code: feature.code, name: feature.name, usageUnit: feature.usageUnit },
        appliedRuleType,
        reason: 'CapabilityDisabledForTargetTenant',
      };
    }

    // If resource is metered and has a strict usage ceiling, calculate cumulative monthly metrics
    let currentUsageCount = 0;
    const limitValue = quotaLimitStr ? parseInt(quotaLimitStr, 10) : null;

    if (feature.isMetered && limitValue !== null) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const usageAgg = await this.dataSource
        .getRepository(FeatureUsageLog)
        .createQueryBuilder('log')
        .select('SUM(CAST(log.usageCount AS BIGINT))', 'total')
        .where('log.schoolId = :schoolId', { schoolId })
        .andWhere('log.platformFeatureId = :platformFeatureId', { platformFeatureId: feature.id })
        .andWhere('log.usageDate >= :startOfMonth', { startOfMonth })
        .getRawOne();

      currentUsageCount = parseInt(usageAgg?.total || '0', 10);

      if (currentUsageCount >= limitValue) {
        return {
          isAllowed: false,
          featureDetails: { code: feature.code, name: feature.name, usageUnit: feature.usageUnit },
          appliedRuleType,
          quotas: { consumedUnits: currentUsageCount, limitCeiling: limitValue },
          reason: 'MonthlyMeteredQuotaExceeded',
        };
      }
    }

    return {
      isAllowed: true,
      featureDetails: { code: feature.code, name: feature.name, usageUnit: feature.usageUnit },
      appliedRuleType,
      quotas: {
        isMetered: feature.isMetered,
        consumedUnits: currentUsageCount,
        limitCeiling: limitValue,
        remainingUnits: limitValue !== null ? limitValue - currentUsageCount : null,
      },
    };
  }

  /**
   * Tracks metered resource logging increments for billing engine consolidation pipelines.
   */
  async logUsageEvent(schoolId: string, featureCode: string, unitsConsumed: number, telemetryPayload?: Record<string, any>) {
    if (unitsConsumed <= 0) {
      throw new BadRequestException('Units consumed must represent a strictly positive increment');
    }

    const feature = await this.dataSource.getRepository(PlatformFeature).findOne({
      where: { code: featureCode },
    });

    if (!feature) {
      throw new NotFoundException(`Target feature code '${featureCode}' is missing`);
    }

    const log = new FeatureUsageLog();
    log.schoolId = schoolId;
    log.platformFeatureId = feature.id;
    log.usageCount = unitsConsumed.toString();
    log.usageDate = new Date();
    log.metadata = telemetryPayload || {};

    const savedLog = await this.dataSource.getRepository(FeatureUsageLog).save(log);

    return {
      message: 'Usage metrics seamlessly ingested into telemetry log',
      logId: savedLog.id,
      unitsReported: unitsConsumed,
      timestamp: savedLog.usageDate,
    };
  }
}
