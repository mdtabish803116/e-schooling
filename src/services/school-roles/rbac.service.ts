import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';

@Injectable()
export class RBACService {
  constructor(private dataSource: DataSource) {}

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const result = await this.dataSource
      .getRepository(SchoolUserRole)
      .createQueryBuilder('ur')
      .innerJoin(SchoolRolePermission, 'rp', 'rp.role_id = ur.role_id')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permission_id')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.module_id')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operation_id')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.is_active = true')
      .andWhere('ur.is_delete = false')
      .andWhere('LOWER(m.code) = :resource', { resource: resource.toLowerCase() })
      .andWhere('LOWER(o.code) = :action', { action: action.toLowerCase() })
      .andWhere('rp.is_active = true')
      .andWhere('rp.is_delete = false')
      .andWhere('p.is_active = true')
      .andWhere('p.is_delete = false')
      .andWhere('m.is_active = true')
      .andWhere('m.is_delete = false')
      .andWhere('o.is_active = true')
      .andWhere('o.is_delete = false')
      .getOne();

    return !!result;
  }

  /**
   * Returns a Set of module codes (lowercase) for which the user has any active role
   * with a VIEW operation permission. Checks operation.code === 'view' directly in the DB.
   */
  async getViewPermittedModuleCodes(userId: string): Promise<Set<string>> {
    const rows = await this.dataSource
      .getRepository(SchoolUserRole)
      .createQueryBuilder('ur')
      .innerJoin(SchoolRolePermission, 'rp', 'rp.role_id = ur.role_id')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permission_id')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.module_id')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operation_id')
      .select('LOWER(m.code)', 'moduleCode')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.is_active = true')
      .andWhere('ur.is_delete = false')
      .andWhere('rp.is_active = true')
      .andWhere('rp.is_delete = false')
      .andWhere('p.is_active = true')
      .andWhere('p.is_delete = false')
      .andWhere('m.is_active = true')
      .andWhere('m.is_delete = false')
      .andWhere('o.is_active = true')
      .andWhere('o.is_delete = false')
      .andWhere("LOWER(o.code) IN ('view', 'view_assigned')")
      .getRawMany();

    return new Set(rows.map(r => r.moduleCode));
  }
}
