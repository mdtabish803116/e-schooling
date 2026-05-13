import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource, In } from 'typeorm';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { UserRole } from '../../models/entities/rbac/user-role.entity';
import { RolePermission } from '../../models/entities/rbac/role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If endpoint doesn't require any specific permission, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthContext = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required to verify permissions');
    }

    // School owners bypass all feature permission restrictions
    if (user.actorType === 'school_owner') {
      return true;
    }

    // For school users, verify assigned roles contain the requested permission
    const userRoles = await this.dataSource.getRepository(UserRole).find({
      where: { userId: user.id },
      select: ['roleId'],
    });

    if (!userRoles || userRoles.length === 0) {
      throw new ForbiddenException(`Access Denied: Requires permission '${requiredPermission}'`);
    }

    const roleIds = userRoles.map((ur) => ur.roleId);

    // Find the required permission ID by key
    const permission = await this.dataSource.getRepository(ModuleOperationPermission).findOne({
      where: { key: requiredPermission },
      select: ['id'],
    });

    if (!permission) {
      throw new ForbiddenException(`System permission '${requiredPermission}' is not registered`);
    }

    // Check if any of the assigned roles have this permission attached
    const rolePermission = await this.dataSource.getRepository(RolePermission).findOne({
      where: {
        roleId: In(roleIds),
        permissionId: permission.id,
      },
    });

    if (!rolePermission) {
      throw new ForbiddenException(`Access Denied: Requires permission '${requiredPermission}'`);
    }

    return true;
  }
}
