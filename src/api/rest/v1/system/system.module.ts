import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SidebarService } from '../../../../services/system/sidebar.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACService } from '../../../../services/roles/rbac.service';

@Module({
  controllers: [SystemController],
  providers: [SidebarService, EntitlementService, RBACService],
})
export class SystemModule {}
