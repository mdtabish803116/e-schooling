import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from '../../../../services/roles/roles.service';
import { EntitlementModule } from '../entitlement/entitlement.module';

@Module({
  imports: [EntitlementModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
