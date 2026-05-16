import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SidebarService } from '../../../../services/system/sidebar.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [SystemController],
  providers: [SidebarService, EntitlementService],
})
export class SystemModule {}
