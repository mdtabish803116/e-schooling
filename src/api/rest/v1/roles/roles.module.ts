import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from '../../../../services/roles/roles.service';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { RBACModule } from './rbac.module';

@Module({
  imports: [EntitlementModule, RBACModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService]
})
export class RolesModule {}
