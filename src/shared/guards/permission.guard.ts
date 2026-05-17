import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService } from '../../services/school-roles/rbac.service';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing in request');
    }

    // School owners bypass granular RBAC checks for their schools
    if (user.actorType === 'school_owner') {
      return true;
    }

    const hasPermission = await this.rbacService.hasPermission(user.id, requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException({
        message: `Permission '${requiredPermission}' denied`,
      });
    }

    return true;
  }
}
