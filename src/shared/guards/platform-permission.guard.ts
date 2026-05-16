import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource, In } from 'typeorm';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { PlatformRole } from '../../models/entities/platform/platform-role.entity';
import { PlatformUserRoleMapping } from '../../models/entities/platform/platform-user-role-mapping.entity';
import { PlatformRolePermission } from '../../models/entities/platform/platform-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';

@Injectable()
export class PlatformPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthContext = request.user;

    if (!user || user.actorType !== 'platform_user') {
      throw new ForbiddenException('Access restricted to Platform Users');
    }

    // 1. Fetch User Roles
    const userRoleMappings = await this.dataSource.getRepository(PlatformUserRoleMapping).find({
      where: { platformUserId: user.id, isActive: true, isDeleted: false },
      relations: ['platformRole']
    });

    const roles = userRoleMappings.map(m => m.platformRole);

    // 2. ADMIN BYPASS: If any role name is "ADMIN", allow all
    if (roles.some(r => r.name === 'ADMIN')) {
      return true;
    }

    // 3. Check specific permissions
    const roleIds = roles.map(r => r.id);
    if (roleIds.length === 0) return false;

    const rolePermissions = await this.dataSource.getRepository(PlatformRolePermission).find({
      where: { platformRoleId: In(roleIds), isActive: true, isDeleted: false }
    });

    const permissionIds = rolePermissions.map(rp => rp.permissionId);
    if (permissionIds.length === 0) return false;

    const permissions = await this.dataSource.getRepository(ModuleOperationPermission).find({
      where: { id: In(permissionIds), isActive: true, isDeleted: false }
    });

    const hasPermission = permissions.some(p => p.key === requiredPermission);
    
    if (!hasPermission) {
      throw new ForbiddenException(`Missing required platform permission: ${requiredPermission}`);
    }

    return true;
  }
}
