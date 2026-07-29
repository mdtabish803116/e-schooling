import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { DashboardAttendanceController } from './dashboard-attendance.controller';
import { AttendanceService } from '../../../../services/attendance/attendance.service';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [RBACModule],
  controllers: [AttendanceController, DashboardAttendanceController],
  providers: [AttendanceService, EntitlementService],
})
export class AttendanceModule {}
