import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicYearsController } from './academic-years.controller';
import { HolidayController } from './holiday.controller';
import { AcademicService } from '../../../../services/academic/academic.service';
import { HolidayService } from '../../../../services/academic/holiday.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';
import { QueueModule } from '../../../worker/queues/queue.module';

@Module({
  imports: [RBACModule, QueueModule],
  controllers: [AcademicController, AcademicYearsController, HolidayController],
  providers: [AcademicService, HolidayService, EntitlementService],
  exports: [AcademicService],
})
export class AcademicModule {}
