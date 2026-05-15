import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicService } from '../../../../services/academic/academic.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACService } from '../../../../services/roles/rbac.service';

@Module({
  controllers: [AcademicController],
  providers: [AcademicService, EntitlementService, RBACService],
})
export class AcademicModule {}
