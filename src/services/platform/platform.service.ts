import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlatformFeature } from '../../models/entities/entitlement/platform-feature.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { CreatePlatformFeatureDto, CreateModuleMasterDto } from '../../interfaces/request/platform/platform-management.dto';
import { AuthContext } from '../../interfaces/auth-context.interface';

@Injectable()
export class PlatformService {
  constructor(private dataSource: DataSource) {}

  async createFeature(dto: CreatePlatformFeatureDto, caller: AuthContext) {
    const feature = new PlatformFeature();
    feature.name = dto.name;
    feature.code = dto.code;
    feature.description = dto.description;
    feature.createdById = caller.id;
    return this.dataSource.getRepository(PlatformFeature).save(feature);
  }

  async createModule(dto: CreateModuleMasterDto, caller: AuthContext) {
    const module = new ModuleMaster();
    module.name = dto.name;
    module.code = dto.code;
    module.description = dto.description;
    module.platformFeatureId = dto.platformFeatureId;
    module.parentModuleId = dto.parentModuleId;
    module.routePath = dto.routePath;
    module.icon = dto.icon;
    module.showInSidebar = dto.showInSidebar ?? true;
    module.isMenuGroup = dto.isMenuGroup ?? false;
    module.createdById = caller.id;
    return this.dataSource.getRepository(ModuleMaster).save(module);
  }

  async listFeatures() {
    return this.dataSource.getRepository(PlatformFeature).find({ where: { isActive: true, isDeleted: false } });
  }

  async listModules() {
    return this.dataSource.getRepository(ModuleMaster).find({ where: { isActive: true, isDeleted: false }, order: { displayOrder: 'ASC' } });
  }
}
