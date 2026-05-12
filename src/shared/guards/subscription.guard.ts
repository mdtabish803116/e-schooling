import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SubscriptionStatusEnum } from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';

/**
 * SubscriptionGuard intercepts feature-level API access to verify if the target school's
 * subscription or Free Trial is currently valid and unexpired.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthContext = request.user;

    if (!user) {
      return true; // Let standard auth guards handle unauthenticated users
    }

    // Resolve target school ID from user context, path parameters, query, body, or custom headers
    const schoolId =
      user.schoolId ||
      request.params?.schoolId ||
      request.query?.schoolId ||
      request.body?.schoolId ||
      request.headers?.['x-school-id'];

    if (!schoolId) {
      throw new BadRequestException('School context required to verify subscription access');
    }

    const subscription = await this.dataSource.getRepository(SchoolSubscription).findOne({
      where: { schoolId },
      relations: [], // Fast direct lookup
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription profile found for this school');
    }

    const now = new Date();

    // Verify Trial Expiration
    if (subscription.status === SubscriptionStatusEnum.TRIAL) {
      if (!subscription.trialEndAt || now > subscription.trialEndAt) {
        throw new ForbiddenException(
          'Your 30-day Free Trial has expired. Please select a base subscription plan to continue using E-School features.'
        );
      }
      return true;
    }

    // Verify Active / Renewal Status
    if (
      subscription.status === SubscriptionStatusEnum.EXPIRED ||
      subscription.status === SubscriptionStatusEnum.CANCELLED ||
      subscription.status === SubscriptionStatusEnum.SUSPENDED
    ) {
      throw new ForbiddenException(
        `School subscription is currently '${subscription.status}'. Please renew or upgrade your plan to restore access.`
      );
    }

    // If subscription has a rigid period boundary enforcement
    if (subscription.currentPeriodEnd && now > subscription.currentPeriodEnd) {
      throw new ForbiddenException(
        'Your subscription renewal cycle is past due. Please process payment to restore feature access.'
      );
    }

    return true;
  }
}
