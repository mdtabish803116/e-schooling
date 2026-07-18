import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { EntitlementService } from '../entitlement/entitlement.service';
import { RBACService } from '../school-roles/rbac.service';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import type { AuthContext } from '../../interfaces/auth-context.interface';

@Injectable()
export class SidebarService {
  constructor(
    private dataSource: DataSource,
    private entitlementService: EntitlementService,
    private rbacService: RBACService,
  ) {}

  async getDynamicSidebar(caller: AuthContext, querySchoolId?: string) {
    const schoolId = querySchoolId || caller.schoolId;
    if (!schoolId) {
      return [];
    }

    const isOwner = caller.actorType === 'school_owner';

    // Verify ownership if caller is owner
    if (isOwner) {
      const membership = await this.dataSource.getRepository(SchoolOwnerMember).findOne({
        where: { schoolOwnerId: caller.id, schoolId, isActive: true },
      });
      if (!membership) {
        throw new ForbiddenException('Unauthorized access to this school');
      }
    }

    // 1. Fetch all platform features to check entitlements
    const features = await this.dataSource.getRepository(PlatformFeature).find({ where: { isActive: true } });
    const enabledFeatureIds: string[] = [];

    for (const feature of features) {
      const access = await this.entitlementService.evaluateFeatureAccess(schoolId, feature.code);
      if (access.isAllowed) {
        enabledFeatureIds.push(feature.id);
      }
    }

    // 2. Fetch modules linked to enabled features
    const allModules = await this.dataSource.getRepository(ModuleMaster).find({
      where: { isActive: true, isDeleted: false, showInSidebar: true },
      order: { displayOrder: 'ASC' },
    });

    // 3. Filter modules by entitlement and user permissions
    const viewableModuleCodes = isOwner ? null : await this.rbacService.getViewPermittedModuleCodes(caller.id);

    console.log('[SIDEBAR DEBUG] userId:', caller.id, 'actorType:', caller.actorType, 'schoolId:', schoolId);
    console.log('[SIDEBAR DEBUG] allModules count:', allModules.length);
    console.log('[SIDEBAR DEBUG] enabledFeatureIds:', enabledFeatureIds);
    console.log('[SIDEBAR DEBUG] viewableModuleCodes:', viewableModuleCodes ? [...viewableModuleCodes] : 'OWNER(all)');

    // Modules that are either not linked to a specific feature (global) or linked to an enabled one
    const allowedModules = allModules.filter(module => {
      const isFeatureEnabled = !module.platformFeatureId || enabledFeatureIds.includes(module.platformFeatureId);
      if (!isFeatureEnabled) {
        console.log(`[SIDEBAR DEBUG] Module "${module.code}" blocked by feature entitlement (featureId: ${module.platformFeatureId})`);
        return false;
      }

      if (isOwner) {
        return true; // School owners see all modules enabled on the plan
      }

      // Check if the user has a VIEW operation permission for this module (via DB, not string key)
      const hasView = viewableModuleCodes!.has(module.code.toLowerCase()) || module.isMenuGroup;
      if (!hasView) {
        console.log(`[SIDEBAR DEBUG] Module "${module.code}" blocked — no view permission`);
      }
      return hasView;
    });

    console.log('[SIDEBAR DEBUG] allowedModules count:', allowedModules.length, allowedModules.map(m => m.code));

    // 4. Build hierarchy
    return this.buildTree(allowedModules);
  }

  private buildTree(modules: ModuleMaster[], parentId: string | null = null): any[] {
    const tree: any[] = [];
    const children = modules.filter(m => (m.parentModuleId === parentId) || (!parentId && !m.parentModuleId));

    for (const child of children) {
      const node: any = {
        id: child.id,
        name: child.name,
        code: child.code,
        route: child.routePath,
        icon: child.icon,
        isMenuGroup: child.isMenuGroup,
      };

      const subChildren = this.buildTree(modules, child.id);
      if (subChildren.length > 0) {
        node.children = subChildren;
      }

      // If it is a menu group but has no children allowed, skip showing it to prevent empty groups on sidebar
      if (child.isMenuGroup && (!node.children || node.children.length === 0)) {
        continue;
      }

      tree.push(node);
    }

    return tree;
  }
}
