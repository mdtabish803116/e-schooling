import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CurrentAcademicSession } from '../../../../shared/decorators/current-academic-session.decorator';
import { AttendanceService } from '../../../../services/attendance/attendance.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';

@ApiTags('Attendance Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('ATTENDANCE_MANAGEMENT')
@Controller('schools/:schoolId/dashboard')
export class DashboardAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @ApiOperation({
    summary: 'Get attendance dashboard analytics summary (Dashboard URL alias)',
  })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('attendance')
  async getAttendanceDashboard(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('date') date?: string,
    @Query('academicSessionId') querySessionId?: string,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.attendanceService.getAttendanceDashboard(
      caller,
      schoolId,
      date,
      academicSessionId,
    );
  }
}
