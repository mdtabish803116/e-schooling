import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { UploadController } from './upload.controller';
import { CryptoDevController } from './crypto-dev.controller';
import { SidebarService } from '../../../../services/system/sidebar.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [SystemController, UploadController, CryptoDevController],
  providers: [SidebarService, EntitlementService],
})
export class SystemModule {}
