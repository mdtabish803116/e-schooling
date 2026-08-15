import { Module } from '@nestjs/common';
import { LookupsController } from './lookups.controller';
import { LookupsService } from '../../../../services/lookups/lookups.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [LookupsController],
  providers: [LookupsService],
  exports: [LookupsService],
})
export class LookupsModule {}
