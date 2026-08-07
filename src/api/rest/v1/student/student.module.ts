import { Module } from '@nestjs/common';
import { StudentAdmissionsService } from '../../../../services/student/student-admissions.service';
import { StudentAdmissionsController } from './student-admissions.controller';
import { StudentCredentialsController } from './student-credentials.controller';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';
import { QueueModule } from '../../../worker/queues/queue.module';

@Module({
  imports: [RBACModule, QueueModule],
  controllers: [StudentAdmissionsController, StudentCredentialsController],
  providers: [StudentAdmissionsService, EntitlementService],
  exports: [StudentAdmissionsService],
})
export class StudentModule {}
