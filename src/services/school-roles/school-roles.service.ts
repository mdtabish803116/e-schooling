import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { EntitlementService } from '../entitlement/entitlement.service';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateSchoolRoleDto } from '../../interfaces/request/school-role/create-school-role.dto';
import { UpdateSchoolRoleDto } from '../../interfaces/request/school-role/update-school-role.dto';
import {
  ApiResponse,
  ApiResponseException,
} from '../../shared/utils/response.utils';

@Injectable()
export class SchoolRolesService {
  constructor(
    private dataSource: DataSource,
    private entitlementService: EntitlementService,
  ) {}

  private async assertAccessToSchool(
    caller: AuthContext,
    schoolId: string,
  ): Promise<void> {
    if (caller.actorType === 'school_owner') {
      const membership = await this.dataSource
        .getRepository(SchoolOwnerMember)
        .findOne({ where: { schoolOwnerId: caller.id, schoolId } });

      if (!membership) {
        throw new ForbiddenException('You do not have access to this school');
      }
    } else if (caller.actorType === 'school_user') {
      if (caller.schoolId !== schoolId) {
        throw new ForbiddenException('You do not belong to this school');
      }
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  /**
   * Step 1: Create a basic School Role metadata.
   */
  async createSchoolRole(
    caller: AuthContext,
    schoolId: string,
    dto: CreateSchoolRoleDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const roleRepo = this.dataSource.getRepository(SchoolRole);

    // Fetch all roles in this school (both active and soft deleted/inactive)
    const existingRoles = await roleRepo.find({ where: { schoolId } });
    const normalizedIncoming = dto.name.trim().toUpperCase();

    const duplicate = existingRoles.find(
      (r) => r.name.trim().toUpperCase() === normalizedIncoming,
    );

    if (duplicate) {
      if (duplicate.isDeleted) {
        // Upsert / Reactivate the soft-deleted role!
        duplicate.isDeleted = false;
        duplicate.isActive = true;
        if (dto.description !== undefined) {
          duplicate.description = dto.description;
        }
        duplicate.updatedById = caller.id;

        const savedRole = await roleRepo.save(duplicate);
        return {
          message: 'School role reactivated successfully from history.',
          role: {
            id: savedRole.id,
            name: savedRole.name,
            description: savedRole.description,
          },
        };
      } else if (!duplicate.isActive) {
        // Exist but inactive
        throw new BadRequestException(
          `Role '${duplicate.name}' already exists but is inactive. Please make this active using the activation API.`,
        );
      } else {
        // Active duplicate
        throw new BadRequestException(
          `Role '${duplicate.name}' already exists and is active.`,
        );
      }
    }

    const role = new SchoolRole();
    role.schoolId = schoolId;
    role.name = dto.name;
    role.description = dto.description;
    role.isActive = true;
    role.createdById = caller.id;

    const savedRole = await roleRepo.save(role);

    return {
      message:
        'School role created successfully. You can now assign permissions to it.',
      role: {
        id: savedRole.id,
        name: savedRole.name,
        description: savedRole.description,
      },
    };
  }

  /**
   * Update School Role metadata.
   */
  async updateSchoolRole(
    caller: AuthContext,
    schoolId: string,
    schoolRoleId: string,
    dto: UpdateSchoolRoleDto,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const roleRepo = this.dataSource.getRepository(SchoolRole);
    const role = await roleRepo.findOne({
      where: { id: schoolRoleId, schoolId },
    });
    if (!role || role.isDeleted)
      throw new NotFoundException('This role does not exist');

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    role.updatedById = caller.id;

    const savedRole = await roleRepo.save(role);
    return {
      message: 'School role updated successfully',
      role: {
        id: savedRole.id,
        name: savedRole.name,
        description: savedRole.description,
      },
    };
  }

  /**
   * Step 2: Assign Granular Permissions to a School Role.
   */
  async assignPermissionsToSchoolRole(
    caller: AuthContext,
    schoolId: string,
    schoolRoleId: string,
    permissionIds: string[],
  ) {
    try {
      await this.assertAccessToSchool(caller, schoolId);

      const role = await this.dataSource
        .getRepository(SchoolRole)
        .findOne({ where: { id: schoolRoleId, schoolId } });
      if (!role || role.isDeleted)
        throw new NotFoundException('This role does not exist');
      if (!role.isActive) {
        throw new BadRequestException(
          'This role is inactive. Please activate it first before assigning permissions.',
        );
      }

      // Validate all permissionIds exist and are not deleted
      for (const pId of permissionIds) {
        const permissionExists = await this.dataSource
          .getRepository(ModuleOperationPermission)
          .findOne({ where: { id: pId, isDeleted: false } });
        if (!permissionExists) {
          throw new NotFoundException('This permission does not exist');
        }
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        if (permissionIds.length > 0) {
          await queryRunner.manager.update(
            SchoolRolePermission,
            {
              roleId: schoolRoleId,
              permissionId: Not(In(permissionIds)),
            },
            { isActive: false },
          );
        } else {
          await queryRunner.manager.update(
            SchoolRolePermission,
            { roleId: schoolRoleId },
            { isActive: false },
          );
        }

        for (const pId of permissionIds) {
          // Soft-Upsert: If mapping exists but is deleted/inactive, reactivate it.
          let mapping = await queryRunner.manager.findOne(
            SchoolRolePermission,
            {
              where: { roleId: schoolRoleId, permissionId: pId },
            },
          );

          if (mapping) {
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
        return ApiResponse.success(
          null,
          'Permissions assigned/reactivated successfully',
          200,
        );
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error: unknown) {
      if (error instanceof ApiResponseException) {
        throw error;
      }
      const err = error as {
        status?: number;
        getStatus?: () => number;
        message?: string;
        name?: string;
      };
      const status = err.status || (err.getStatus ? err.getStatus() : 500);
      const message = err.message || 'An error occurred';
      throw new ApiResponseException(
        message,
        status,
        err.name || 'INTERNAL_SERVER_ERROR',
      );
    }
  }

  /**
   * Activate/Deactivate a permission from a School Role.
   */
  async updatePermissionStatusForSchoolRole(
    caller: AuthContext,
    schoolId: string,
    schoolRoleId: string,
    permissionId: string,
    isActive: boolean,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const role = await this.dataSource
      .getRepository(SchoolRole)
      .findOne({ where: { id: schoolRoleId, schoolId } });
    if (!role || role.isDeleted)
      throw new NotFoundException('This role does not exist');

    const mappingRepo = this.dataSource.getRepository(SchoolRolePermission);
    const mapping = await mappingRepo.findOne({
      where: { roleId: schoolRoleId, permissionId },
    });

    if (mapping) {
      mapping.isActive = isActive;
      await mappingRepo.save(mapping);
    }

    return ApiResponse.success(
      null,
      `Permission status updated successfully to ${isActive ? 'Active' : 'Inactive'}`,
      200,
    );
  }

  /**
   * List all school roles in a school.
   */
  async listSchoolRoles(caller: AuthContext, schoolId: string) {
    await this.assertAccessToSchool(caller, schoolId);

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
  async listAccessiblePermissionsForSchool(
    caller: AuthContext,
    schoolId: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const basePermissions = await this.dataSource
      .getRepository(ModuleOperationPermission)
      .find({
        where: { isActive: true, isDeleted: false },
      });

    if (!basePermissions.length) return { accessibleModules: [] };

    const moduleIds = [
      ...new Set(basePermissions.map((p) => p.moduleId).filter(Boolean)),
    ];
    const modules = await this.dataSource.getRepository(ModuleMaster).find({
      where: { id: In(moduleIds), isActive: true },
    });

    const moduleMap = new Map(modules.map((m) => [m.id, m]));
    const platformFeatureIds = [
      ...new Set(modules.map((m) => m.platformFeatureId).filter(Boolean)),
    ];

    const pFeatures = await this.dataSource
      .getRepository(PlatformFeature)
      .find({
        where: { id: In(platformFeatureIds) },
      });
    const featureCodeMap = new Map(pFeatures.map((pf) => [pf.id, pf.code]));

    const clearedModuleIds = new Set<string>();
    for (const [modId, modObj] of moduleMap.entries()) {
      if (!modObj.platformFeatureId) {
        clearedModuleIds.add(modId);
      } else {
        const featureCode = featureCodeMap.get(modObj.platformFeatureId);
        if (featureCode) {
          const check = await this.entitlementService.evaluateFeatureAccess(
            schoolId,
            featureCode,
          );
          if (check.isAllowed) clearedModuleIds.add(modId);
        }
      }
    }

    const ops = await this.dataSource.getRepository(OperationMaster).find({
      where: { isActive: true, isDeleted: false },
    });
    const opCodeMap = new Map(ops.map((o) => [o.id, o.code]));

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

        const opCode = opCodeMap.get(p.operationId);
        groupedResults.get(p.moduleId).operations.push({
          permissionId: p.id,
          operationId: p.operationId,
          key: `${modObj.code.toLowerCase()}:${opCode?.toLowerCase()}`,
          description: p.description,
        });
      }
    }

    return { accessibleModules: Array.from(groupedResults.values()) };
  }

  /**
   * Update the active status (activation/deactivation) of a school role.
   */
  async updateSchoolRoleStatus(
    caller: AuthContext,
    schoolId: string,
    schoolRoleId: string,
    isActive: boolean,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const roleRepo = this.dataSource.getRepository(SchoolRole);
    const role = await roleRepo.findOne({
      where: { id: schoolRoleId, schoolId },
    });
    if (!role || role.isDeleted)
      throw new NotFoundException('This role does not exist');

    role.isActive = isActive;
    role.updatedById = caller.id;

    await roleRepo.save(role);

    return {
      message: `School role successfully ${isActive ? 'activated' : 'deactivated'}.`,
      role: { id: role.id, name: role.name, isActive: role.isActive },
    };
  }

  /**
   * Get all active permissions currently assigned to a school role.
   */
  async getPermissionsForSchoolRole(
    caller: AuthContext,
    schoolId: string,
    schoolRoleId: string,
  ) {
    await this.assertAccessToSchool(caller, schoolId);

    const role = await this.dataSource.getRepository(SchoolRole).findOne({
      where: { id: schoolRoleId, schoolId },
    });
    if (!role || role.isDeleted)
      throw new NotFoundException('This role does not exist');

    const permissions = await this.dataSource
      .getRepository(SchoolRolePermission)
      .createQueryBuilder('rp')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permissionId')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.moduleId')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operationId')
      .select([
        'p.id as id',
        "CONCAT(LOWER(m.code), ':', LOWER(o.code)) as key",
        'p.description as description',
      ])
      .where('rp.roleId = :schoolRoleId', { schoolRoleId })
      .andWhere('rp.isActive = true')
      .andWhere('rp.isDeleted = false')
      .getRawMany();

    return { permissions };
  }

  /**
   * Get details of a school role by its ID.
   */
  async getSchoolRole(
    caller: AuthContext,
    schoolId: string,
    schoolRoleId: string,
  ) {
    if (!schoolRoleId || schoolRoleId === 'undefined') {
      throw new BadRequestException('Invalid role ID');
    }

    await this.assertAccessToSchool(caller, schoolId);

    const role = await this.dataSource.getRepository(SchoolRole).findOne({
      where: { id: schoolRoleId, schoolId, isDeleted: false },
    });
    if (!role) {
      throw new NotFoundException('This role does not exist');
    }

    const permissions = await this.dataSource
      .getRepository(SchoolRolePermission)
      .createQueryBuilder('rp')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permissionId')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.moduleId')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operationId')
      .select([
        'p.id as id',
        "CONCAT(LOWER(m.code), ':', LOWER(o.code)) as key",
        'p.description as description',
      ])
      .where('rp.roleId = :schoolRoleId', { schoolRoleId })
      .andWhere('rp.isActive = true')
      .andWhere('rp.isDeleted = false')
      .getRawMany();

    return { role, permissions };
  }
}
