import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { HolidayController } from './holiday.controller';
import { AcademicService } from '../../../../services/academic/academic.service';
import { HolidayService } from '../../../../services/academic/holiday.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [AcademicController, HolidayController],
  providers: [AcademicService, HolidayService, EntitlementService],
})
export class AcademicModule {}
