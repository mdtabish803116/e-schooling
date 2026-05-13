import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../../models/entities/rbac/role.entity';
import { RolePermission } from '../../models/entities/rbac/role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { SchoolMember } from '../../models/entities/school/school-member.entity';
import { EntitlementService } from '../entitlement/entitlement.service';
import { StatusEnum } from '../../models/enums/enums';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateRoleDto } from '../../interfaces/request/role/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private dataSource: DataSource,
    private entitlementService: EntitlementService,
  ) {}

  private async assertOwnershipOfSchool(ownerId: string, schoolId: string): Promise<void> {
    const membership = await this.dataSource
      .getRepository(SchoolMember)
      .findOne({ where: { schoolOwnerId: ownerId, schoolId } });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this school');
    }
  }

  /**
   * School owner creates a custom Role for their school,
   * optionally attaching permissions (which were created by platform admins).
   */
  async createRole(caller: AuthContext, schoolId: string, dto: CreateRoleDto) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = new Role();
      role.schoolId = schoolId;
      role.name = dto.name;
      role.status = StatusEnum.ACTIVE;
      role.createdById = caller.id;

      const savedRole = await queryRunner.manager.save(role);

      // Attach permissions if provided
      if (dto.permissionIds && dto.permissionIds.length > 0) {
        for (const permissionId of dto.permissionIds) {
          const permission = await queryRunner.manager.findOne(ModuleOperationPermission, {
            where: { id: permissionId },
          });
          if (!permission) {
            throw new NotFoundException(`Permission ${permissionId} not found`);
          }

          const rp = new RolePermission();
          rp.roleId = savedRole.id;
          rp.permissionId = permissionId;
          rp.createdById = caller.id;
          await queryRunner.manager.save(rp);
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Role created successfully',
        role: {
          id: savedRole.id,
          name: savedRole.name,
          schoolId: savedRole.schoolId,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * List all roles in a school.
   */
  async listRoles(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    const roles = await this.dataSource.getRepository(Role).find({
      where: { schoolId, status: StatusEnum.ACTIVE },
      select: ['id', 'name', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return { roles };
  }

  /**
   * Intelligently compiles and renders the exact list of granular Module/Operation choices
   * authorized for assignment within the target tenant branch context.
   * Seamlessly applies underlying PlatformFeature entitlement checks to lock out unpaid commercial tiers.
   */
  async listAccessiblePermissionsForSchool(caller: AuthContext, schoolId: string) {
    await this.assertOwnershipOfSchool(caller.id, schoolId);

    // 1. Fetch baseline platform master permissions alongside tenant custom overrides
    const basePermissions = await this.dataSource
      .getRepository(ModuleOperationPermission)
      .createQueryBuilder('p')
      .where('p.schoolId IS NULL')
      .orWhere('p.schoolId = :schoolId', { schoolId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('p.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();

    if (!basePermissions || basePermissions.length === 0) {
      return { accessibleModules: [] };
    }

    // 2. Extract connected ModuleMaster parameters to read platformFeatureId references
    const moduleIds = [...new Set(basePermissions.map((p) => p.moduleId).filter(Boolean))];
    let moduleMap = new Map<string, ModuleMaster>();

    if (moduleIds.length > 0) {
      const modules = await this.dataSource
        .getRepository(ModuleMaster)
        .createQueryBuilder('m')
        .where('m.id IN (:...moduleIds)', { moduleIds })
        .andWhere('m.isActive = :isActive', { isActive: true })
        .getMany();

      modules.forEach((m) => moduleMap.set(m.id, m));
    }

    // 3. Pre-fetch underlying PlatformFeatures to inspect actual string feature codes
    const platformFeatureIds = [...new Set(Array.from(moduleMap.values()).map((m) => m.platformFeatureId).filter(Boolean))];
    let featureCodeMap = new Map<string, string>(); // Maps PlatformFeature.id -> code

    if (platformFeatureIds.length > 0) {
      const pFeatures = await this.dataSource
        .getRepository(PlatformFeature)
        .createQueryBuilder('pf')
        .where('pf.id IN (:...platformFeatureIds)', { platformFeatureIds })
        .getMany();

      pFeatures.forEach((pf) => featureCodeMap.set(pf.id, pf.code));
    }

    // 4. Evaluate dynamic subscription access for add-on controlled features
    let clearedModuleIds = new Set<string>();

    for (const [modId, modObj] of moduleMap.entries()) {
      if (!modObj.platformFeatureId) {
        // Universal base modules are unconditionally approved
        clearedModuleIds.add(modId);
      } else {
        const featureCode = featureCodeMap.get(modObj.platformFeatureId);
        if (featureCode) {
          const check = await this.entitlementService.evaluateFeatureAccess(schoolId, featureCode);
          if (check.isAllowed) {
            clearedModuleIds.add(modId);
          }
        }
      }
    }

    // 5. Filter baseline permission sets and group into a highly optimized Admin UI accordion layout
    let groupedResults = new Map<string, { moduleId: string; moduleName: string; moduleCode: string; operations: any[] }>();

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

        groupedResults.get(p.moduleId)?.operations.push({
          permissionId: p.id,
          operationId: p.operationId,
          resource: p.resource,
          action: p.action,
          key: p.key,
          description: p.description,
        });
      }
    }

    return {
      accessibleModules: Array.from(groupedResults.values()),
    };
  }
}
