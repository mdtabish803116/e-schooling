import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { EntitlementService } from '../entitlement/entitlement.service';
import { RBACService } from '../school-roles/rbac.service';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';

@Injectable()
export class SidebarService {
  constructor(
    private dataSource: DataSource,
    private entitlementService: EntitlementService,
    private rbacService: RBACService,
  ) {}

  async getDynamicSidebar(schoolId: string, userId: string) {
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
    const userPermissions = await this.rbacService.getAllUserPermissions(userId);
    
    // Modules that are either not linked to a specific feature (global) or linked to an enabled one
    const allowedModules = allModules.filter(module => {
      const isFeatureEnabled = !module.platformFeatureId || enabledFeatureIds.includes(module.platformFeatureId);
      if (!isFeatureEnabled) return false;

      // Basic permission check: does user have "view" permission for this module?
      // Convention: module.code + ':view'
      const viewPermission = `${module.code.toLowerCase()}:view`;
      return userPermissions.includes(viewPermission) || module.isMenuGroup;
    });

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

      tree.push(node);
    }

    return tree;
  }
}
