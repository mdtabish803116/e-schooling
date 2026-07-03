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
      .innerJoin(ModuleMaster, 'm', 'm.id = p.moduleId')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operationId')
      .where('ur.user_id = :userId', { userId })
      .andWhere('LOWER(m.code) = :resource', { resource: resource.toLowerCase() })
      .andWhere('LOWER(o.code) = :action', { action: action.toLowerCase() })
      .andWhere('rp.is_active = true')
      .andWhere('rp.is_delete = false')
      .andWhere('p.is_active = true')
      .andWhere('p.is_delete = false')
      .andWhere('m.isActive = true')
      .andWhere('m.isDeleted = false')
      .andWhere('o.isActive = true')
      .andWhere('o.isDeleted = false')
      .getOne();

    return !!result;
  }

  async getAllUserPermissions(userId: string): Promise<string[]> {
    const permissions = await this.dataSource
      .getRepository(SchoolUserRole)
      .createQueryBuilder('ur')
      .innerJoin(SchoolRolePermission, 'rp', 'rp.role_id = ur.role_id')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permission_id')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.moduleId')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operationId')
      .select("CONCAT(LOWER(m.code), ':', LOWER(o.code))", 'key')
      .where('ur.user_id = :userId', { userId })
      .andWhere('rp.is_active = true')
      .andWhere('rp.is_delete = false')
      .andWhere('p.is_active = true')
      .andWhere('p.is_delete = false')
      .andWhere('m.isActive = true')
      .andWhere('m.isDeleted = false')
      .andWhere('o.isActive = true')
      .andWhere('o.isDeleted = false')
      .getRawMany();

    return permissions.map(p => p.key);
  }
}
