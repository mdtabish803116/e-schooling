import { Module } from '@nestjs/common';
import { StudentAdmissionsService } from '../../../../services/student/student-admissions.service';
import { StudentAdmissionsController } from './student-admissions.controller';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACService } from '../../../../services/roles/rbac.service';

@Module({
  controllers: [StudentAdmissionsController],
  providers: [StudentAdmissionsService, EntitlementService, RBACService],
  exports: [StudentAdmissionsService]
})
export class StudentModule {}
