import {
  Controller,
  Post,
  Patch,
  Put,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { TakeAttendanceDto } from '../../../../interfaces/request/attendance/take-attendance.dto';
import { UpdateAttendanceDto } from '../../../../interfaces/request/attendance/update-attendance.dto';
import {
  LockAttendanceDto,
  UnlockAttendanceDto,
} from '../../../../interfaces/request/attendance/lock-attendance.dto';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';

@ApiTags('Attendance Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('ATTENDANCE_MANAGEMENT')
@Controller('schools/:schoolId/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @ApiOperation({
    summary:
      'Get bulk attendance session by class/section/date/slot/academicSession',
  })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get()
  async getAttendanceSession(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('date') date: string,
    @Query('sessionSlot') sessionSlot: number,
    @Query('academicSessionId') querySessionId?: string,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.attendanceService.getAttendanceSession(caller, schoolId, {
      classId,
      sectionId,
      date,
      sessionSlot,
      academicSessionId,
    });
  }

  @ApiOperation({ summary: 'Lock attendance for a specific date' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.UPDATE)
  @Post('lock')
  async lockAttendance(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: LockAttendanceDto,
  ) {
    return this.attendanceService.lockAttendance(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Unlock attendance for a specific date' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.UPDATE)
  @Post('unlock')
  async unlockAttendance(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() dto: UnlockAttendanceDto,
  ) {
    return this.attendanceService.unlockAttendance(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Get list of locked attendance dates' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('locks')
  async getAttendanceLocks(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('academicSessionId') querySessionId?: string,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.attendanceService.getAttendanceLocks(
      caller,
      schoolId,
      academicSessionId,
    );
  }

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

  @ApiOperation({ summary: 'Get list of real students for attendance marking' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('students')
  async getAttendanceStudents(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('academicSessionId') querySessionId?: string,
    @Query('date') date?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.attendanceService.getAttendanceStudents(caller, schoolId, {
      classId,
      sectionId,
      academicSessionId,
      date,
      page,
      limit,
    });
  }

  @ApiOperation({ summary: 'Get student attendance history records' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('students/:studentId/history')
  async getStudentHistory(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() caller: AuthContext,
  ) {
    return this.attendanceService.getStudentHistory(
      caller,
      schoolId,
      studentId,
    );
  }

  @ApiOperation({ summary: 'Get attendance dashboard analytics summary' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('dashboard')
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

  @ApiOperation({ summary: 'Get low attendance defaulters report' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('reports/defaulters')
  async getDefaultersReport(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('threshold') threshold?: number,
    @Query('academicSessionId') querySessionId?: string,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.attendanceService.getDefaultersReport(
      caller,
      schoolId,
      Number(threshold) || 75,
      academicSessionId,
    );
  }

  @ApiOperation({ summary: 'Get monthly attendance matrix report' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('reports/monthly')
  async getMonthlyReport(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('yearMonth') yearMonth?: string,
    @Query('academicSessionId') querySessionId?: string,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.attendanceService.getMonthlyReport(caller, schoolId, {
      classId,
      sectionId,
      yearMonth,
      academicSessionId,
    });
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
    return this.attendanceService.updateAttendance(
      caller,
      schoolId,
      sessionId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Get attendance settings for a school' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get('settings')
  async getAttendanceSettings(@Param('schoolId') schoolId: string) {
    return this.attendanceService.getAttendanceSettings(schoolId);
  }

  @ApiOperation({ summary: 'Update attendance settings for a school' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.UPDATE)
  @Put('settings')
  async updateAttendanceSettings(
    @Param('schoolId') schoolId: string,
    @Body() settings: any,
  ) {
    return this.attendanceService.updateAttendanceSettings(schoolId, settings);
  }
}
