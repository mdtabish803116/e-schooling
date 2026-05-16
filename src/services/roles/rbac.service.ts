import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { RolePermission } from '../../models/entities/rbac/role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';

@Injectable()
export class RBACService {
  constructor(private dataSource: DataSource) {}

  async hasPermission(userId: string, permissionKey: string): Promise<boolean> {
    // This query joins user roles -> role permissions -> permissions to check if key exists
    const result = await this.dataSource
      .getRepository(SchoolUserRole)
      .createQueryBuilder('ur')
      .innerJoin(RolePermission, 'rp', 'rp.role_id = ur.role_id')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permission_id')
      .where('ur.user_id = :userId', { userId })
      .andWhere('p.key = :permissionKey', { permissionKey })
      .andWhere('rp.is_active = true')
      .andWhere('rp.is_delete = false')
      .andWhere('p.is_active = true')
      .andWhere('p.is_delete = false')
      .getOne();

    return !!result;
  }

  async getAllUserPermissions(userId: string): Promise<string[]> {
    const permissions = await this.dataSource
      .getRepository(SchoolUserRole)
      .createQueryBuilder('ur')
      .innerJoin(RolePermission, 'rp', 'rp.role_id = ur.role_id')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permission_id')
      .select('p.key', 'key')
      .where('ur.user_id = :userId', { userId })
      .andWhere('rp.is_active = true')
      .andWhere('p.is_active = true')
      .getRawMany();

    return permissions.map(p => p.key);
  }
}
