import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { EntitlementService } from '../entitlement/entitlement.service';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolRoleDto } from '../../interfaces/request/school-role/create-school-role.dto';

@Injectable()
export class SchoolRolesService {
  constructor(
    private dataSource: DataSource,
    private entitlementService: EntitlementService,
  ) { }

  private async assertOwnershipOfSchool(ownerId: string, schoolId: string): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolOwnerMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this school');
    }
  }

  /**
   * Step 1: Create a basic School Role metadata.
   */
  async createSchoolRole(caller: AuthContext, schoolId: string, dto: CreateSchoolRoleDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const role = new SchoolRole();
    role.schoolId = schoolId;
    role.name = dto.name;
    role.isActive = true;
    role.createdById = caller.id;

    const savedRole = await this.dataSource.getRepository(SchoolRole).save(role);

    return {
      message: 'School role created successfully. You can now assign permissions to it.',
      role: { id: savedRole.id, name: savedRole.name }
    };
  }

  /**
   * Update School Role metadata.
   */
  async updateSchoolRole(caller: AuthContext, schoolId: string, schoolRoleId: string, dto: { name?: string, description?: string }) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const roleRepo = this.dataSource.getRepository(SchoolRole);
    const role = await roleRepo.findOne({ where: { id: schoolRoleId, schoolId } });
    if (!role) throw new NotFoundException('School role not found');

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    role.updatedById = caller.id;

    await roleRepo.save(role);
    return { message: 'School role updated successfully' };
  }

  /**
   * Soft delete / Deactivate a School Role.
   */
  async deactivateSchoolRole(caller: AuthContext, schoolId: string, schoolRoleId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const roleRepo = this.dataSource.getRepository(SchoolRole);
    const role = await roleRepo.findOne({ where: { id: schoolRoleId, schoolId } });
    if (!role) throw new NotFoundException('School role not found');

    role.isDeleted = true;
    role.isActive = false;
    role.updatedById = caller.id;

    await roleRepo.save(role);
    return { message: 'School role deactivated successfully (Soft Deleted)' };
  }

  /**
   * Step 2: Assign Granular Permissions to a School Role.
   */
  async assignPermissionsToSchoolRole(caller: AuthContext, schoolId: string, schoolRoleId: string, permissionIds: string[]) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const role = await this.dataSource.getRepository(SchoolRole).findOne({ where: { id: schoolRoleId, schoolId } });
    if (!role) throw new NotFoundException('School role not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const pId of permissionIds) {
        // Soft-Upsert: If mapping exists but is deleted/inactive, reactivate it.
        let mapping = await queryRunner.manager.findOne(SchoolRolePermission, {
          where: { roleId: schoolRoleId, permissionId: pId }
        });

        if (mapping) {
          mapping.isDeleted = false;
          mapping.isActive = true;
        } else {
          mapping = new SchoolRolePermission();
          mapping.roleId = schoolRoleId;
          mapping.permissionId = pId;
        }
        mapping.createdById = caller.id;
        await queryRunner.manager.save(mapping);
      }

      await queryRunner.commitTransaction();
      return { message: 'Permissions assigned/reactivated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deactivate/Remove a permission from a School Role (Soft Delete).
   */
  async removePermissionFromSchoolRole(caller: AuthContext, schoolId: string, schoolRoleId: string, permissionId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const mappingRepo = this.dataSource.getRepository(SchoolRolePermission);
    const mapping = await mappingRepo.findOne({ where: { roleId: schoolRoleId, permissionId } });

    if (mapping) {
      mapping.isDeleted = true;
      mapping.isActive = false;
      await mappingRepo.save(mapping);
    }

    return { message: 'Permission removed from school role successfully (Soft Deleted)' };
  }

  /**
   * List all school roles in a school.
   */
  async listSchoolRoles(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const roles = await this.dataSource.getRepository(SchoolRole).find({
      where: { schoolId, isDeleted: false },
      select: ['id', 'name', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return { roles };
  }

  /**
   * List all accessible permissions for a school (Enforces Feature Locking).
   */
  async listAccessiblePermissionsForSchool(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const basePermissions = await this.dataSource.getRepository(ModuleOperationPermission).find({
      where: { isActive: true, isDeleted: false },
    });

    if (!basePermissions.length) return { accessibleModules: [] };

    const moduleIds = [...new Set(basePermissions.map(p => p.moduleId).filter(Boolean))];
    const modules = await this.dataSource.getRepository(ModuleMaster).find({
      where: { id: In(moduleIds), isActive: true },
    });

    const moduleMap = new Map(modules.map(m => [m.id, m]));
    const platformFeatureIds = [...new Set(modules.map(m => m.platformFeatureId).filter(Boolean))];
    
    const pFeatures = await this.dataSource.getRepository(PlatformFeature).find({
      where: { id: In(platformFeatureIds) },
    });
    const featureCodeMap = new Map(pFeatures.map(pf => [pf.id, pf.code]));

    const clearedModuleIds = new Set<string>();
    for (const [modId, modObj] of moduleMap.entries()) {
      if (!modObj.platformFeatureId) {
        clearedModuleIds.add(modId);
      } else {
        const featureCode = featureCodeMap.get(modObj.platformFeatureId);
        if (featureCode) {
          const check = await this.entitlementService.evaluateFeatureAccess(schoolId, featureCode);
          if (check.isAllowed) clearedModuleIds.add(modId);
        }
      }
    }

    const groupedResults = new Map<string, any>();
    for (const p of basePermissions) {
      if (p.moduleId && clearedModuleIds.has(p.moduleId)) {
        const modObj = moduleMap.get(p.moduleId);
        if (!modObj) continue;

        if (!groupedResults.has(p.moduleId)) {
          groupedResults.set(p.moduleId, {
            moduleId: p.moduleId,
            moduleName: modObj.name,
            moduleCode: modObj.code,
            operations: [],
          });
        }

        groupedResults.get(p.moduleId).operations.push({
          permissionId: p.id,
          operationId: p.operationId,
          key: p.key,
          description: p.description,
        });
      }
    }

    return { accessibleModules: Array.from(groupedResults.values()) };
  }
}
