import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { UploadController } from './upload.controller';
import { SidebarService } from '../../../../services/system/sidebar.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [SystemController, UploadController],
  providers: [SidebarService, EntitlementService],
})
export class SystemModule {}
