import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { RBACService } from '../../services/school-roles/rbac.service';
import { PERMISSION_KEY, PermissionMetadata } from '../decorators/permission.decorator';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing in request');
    }

    // SCHOOL ID TENANT VALIDATION & OWNERSHIP CHECK
    const routeSchoolId = request.params?.schoolId || request.body?.schoolId || request.query?.schoolId;
    if (routeSchoolId && routeSchoolId !== 'undefined') {
      if (user.actorType === 'school_owner') {
        const membership = await this.dataSource.getRepository(SchoolOwnerMember).findOne({
          where: { schoolOwnerId: user.id, schoolId: routeSchoolId, isActive: true },
        });
        if (!membership) {
          throw new ForbiddenException('Unauthorized access to this school');
        }
      } else if (user.schoolId && user.schoolId !== routeSchoolId) {
        throw new ForbiddenException('Unauthorized access to this school');
      }
    }

    if (!requiredPermission) {
      return true;
    }

    // School owners bypass granular RBAC checks for their schools
    if (user.actorType === 'school_owner') {
      return true;
    }

    const hasPermission = await this.rbacService.hasPermission(
      user.id,
      requiredPermission.resource,
      requiredPermission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        message: `Permission '${requiredPermission.resource}:${requiredPermission.action}' denied`,
      });
    }

    return true;
  }
}
