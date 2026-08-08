import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { EntitlementService } from '../../services/entitlement/entitlement.service';
import { FEATURE_KEY } from '../decorators/feature.decorator';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private entitlementService: EntitlementService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const routeSchoolId =
      request.params?.schoolId ||
      request.body?.schoolId ||
      request.query?.schoolId;
    const schoolId = user?.schoolId || routeSchoolId;

    if (!schoolId) {
      throw new ForbiddenException('School context missing in request');
    }

    // SCHOOL ID TENANT VALIDATION & OWNERSHIP CHECK
    if (routeSchoolId) {
      if (user.actorType === 'school_owner') {
        const membership = await this.dataSource
          .getRepository(SchoolOwnerMember)
          .findOne({
            where: {
              schoolOwnerId: user.id,
              schoolId: routeSchoolId,
              isActive: true,
            },
          });
        if (!membership) {
          throw new ForbiddenException('Unauthorized access to this school');
        }
      } else if (
        user.schoolId &&
        String(user.schoolId) !== String(routeSchoolId)
      ) {
        throw new ForbiddenException('Unauthorized access to this school');
      }
    }

    if (!requiredFeature) {
      return true;
    }

    // School owners bypass feature checks if they are platform admins,
    // but usually features are tenant-level, so we still check entitlement for the school.
    const access = await this.entitlementService.evaluateFeatureAccess(
      schoolId,
      requiredFeature,
    );

    if (!access.isAllowed) {
      throw new ForbiddenException({
        message: `Feature '${requiredFeature}' not subscribed or quota exceeded`,
        reason: access.reason,
      });
    }

    return true;
  }
}
