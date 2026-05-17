import { Module } from '@nestjs/common';
import { SchoolRolesController } from './school-roles.controller';
import { SchoolRolesService } from '../../../../services/school-roles/school-roles.service';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { RBACModule } from './rbac.module';

@Module({
  imports: [EntitlementModule, RBACModule],
  controllers: [SchoolRolesController],
  providers: [SchoolRolesService],
  exports: [SchoolRolesService]
})
export class SchoolRolesModule {}
