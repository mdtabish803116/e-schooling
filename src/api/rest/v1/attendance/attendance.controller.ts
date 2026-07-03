import { Controller, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { AttendanceService } from '../../../../services/attendance/attendance.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { TakeAttendanceDto } from '../../../../interfaces/request/attendance/take-attendance.dto';
import { UpdateAttendanceDto } from '../../../../interfaces/request/attendance/update-attendance.dto';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';

@ApiTags('Attendance Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('ATTENDANCE_MANAGEMENT')
@Controller('schools/:schoolId/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @ApiOperation({ summary: 'Take class/section student attendance in bulk' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.CREATE)
  @Post()
  async takeAttendance(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: TakeAttendanceDto,
  ) {
    return this.attendanceService.takeAttendance(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Bulk update specific student attendance marks' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.UPDATE)
  @Patch(':sessionId')
  async updateAttendance(
    @Param('schoolId') schoolId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAttendance(caller, schoolId, sessionId, dto);
  }
}
