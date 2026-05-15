import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementService } from '../../services/entitlement/entitlement.service';
import { FEATURE_KEY } from '../decorators/feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const schoolId = user?.schoolId;

    if (!schoolId) {
      throw new ForbiddenException('School context missing in request');
    }

    // School owners bypass feature checks if they are platform admins, 
    // but usually features are tenant-level, so we still check entitlement for the school.
    const access = await this.entitlementService.evaluateFeatureAccess(schoolId, requiredFeature);

    if (!access.isAllowed) {
      throw new ForbiddenException({
        message: `Feature '${requiredFeature}' not subscribed or quota exceeded`,
        reason: access.reason,
      });
    }

    return true;
  }
}
