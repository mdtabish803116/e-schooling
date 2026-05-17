import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicService } from '../../../../services/academic/academic.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [AcademicController],
  providers: [AcademicService, EntitlementService],
})
export class AcademicModule {}
