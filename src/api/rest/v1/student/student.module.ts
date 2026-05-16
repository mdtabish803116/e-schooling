import { Module } from '@nestjs/common';
import { StudentAdmissionsService } from '../../../../services/student/student-admissions.service';
import { StudentAdmissionsController } from './student-admissions.controller';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [StudentAdmissionsController],
  providers: [StudentAdmissionsService, EntitlementService],
  exports: [StudentAdmissionsService]
})
export class StudentModule {}
