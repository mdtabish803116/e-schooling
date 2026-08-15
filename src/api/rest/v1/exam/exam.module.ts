import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { ExamService } from '../../../../services/exam/exam.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [ExamController],
  providers: [ExamService, EntitlementService],
  exports: [ExamService],
})
export class ExamModule {}
