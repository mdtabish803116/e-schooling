import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
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
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { ExamService } from '../../../../services/exam/exam.service';

@ApiTags('Exam Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('EXAM_MANAGEMENT')
@Controller('schools/:schoolId')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @ApiOperation({ summary: 'List all exams for a school' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.VIEW)
  @Get('exams')
  async getExams(
    @Param('schoolId') schoolId: string,
    @CurrentAcademicSession() sessionFromHeader: string | null,
    @Query('academicSessionId') querySessionId?: string,
  ) {
    const academicSessionId = querySessionId || sessionFromHeader || undefined;
    return this.examService.getExams(schoolId, academicSessionId);
  }

  @ApiOperation({ summary: 'Create new exam' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.CREATE)
  @Post('exams')
  async createExam(
    @Param('schoolId') schoolId: string,
    @CurrentUser() caller: AuthContext,
    @Body() body: any,
  ) {
    return this.examService.createExam(schoolId, body, caller);
  }

  @ApiOperation({ summary: 'Get exam details by ID' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.VIEW)
  @Get('exams/:examId')
  async getExamDetail(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
  ) {
    return this.examService.getExamDetail(schoolId, examId);
  }

  @ApiOperation({ summary: 'Update exam details' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.UPDATE)
  @Patch('exams/:examId')
  async updateExamPatch(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
    @Body() body: any,
  ) {
    return this.examService.updateExam(schoolId, examId, body);
  }

  @ApiOperation({ summary: 'Update exam details (PUT)' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.UPDATE)
  @Put('exams/:examId')
  async updateExamPut(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
    @Body() body: any,
  ) {
    return this.examService.updateExam(schoolId, examId, body);
  }

  @ApiOperation({ summary: 'Delete exam' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.DELETE)
  @Delete('exams/:examId')
  async deleteExam(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
  ) {
    return this.examService.deleteExam(schoolId, examId);
  }

  @ApiOperation({ summary: 'Get subjects assigned to exam' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.VIEW)
  @Get('exams/:examId/subjects')
  async getExamSubjects(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
  ) {
    return this.examService.getExamSubjects(schoolId, examId);
  }

  @ApiOperation({ summary: 'Assign subjects to exam' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.UPDATE)
  @Post('exams/:examId/subjects')
  async assignExamSubjects(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
    @Body() body: any,
  ) {
    const subjects = Array.isArray(body) ? body : [body];
    return this.examService.assignExamSubjects(schoolId, examId, subjects);
  }

  @ApiOperation({ summary: 'Get exam timetable schedule' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.VIEW)
  @Get('exams/:examId/schedule')
  async getExamSchedule(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
  ) {
    return this.examService.getExamSchedule(schoolId, examId);
  }

  @ApiOperation({ summary: 'Create exam timetable schedule' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.UPDATE)
  @Post('exams/:examId/schedule')
  async createExamSchedule(
    @Param('schoolId') schoolId: string,
    @Param('examId') examId: string,
    @Body() body: any,
  ) {
    return this.examService.createExamSchedule(schoolId, examId, body);
  }

  @ApiOperation({ summary: 'Get student exam marks' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.VIEW)
  @Get('students/:studentId/marks')
  async getStudentMarks(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.examService.getStudentMarks(schoolId, studentId);
  }

  @ApiOperation({ summary: 'Submit student exam marks' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.CREATE)
  @Post('marks')
  async submitMarks(
    @Param('schoolId') schoolId: string,
    @Body() body: any,
  ) {
    const marks = Array.isArray(body) ? body : [body];
    return this.examService.submitMarks(schoolId, marks);
  }

  @ApiOperation({ summary: 'Get exam analytics' })
  @Permission(ResourceEnum.EXAMS, ActionEnum.VIEW)
  @Get('analytics/exams')
  async getExamAnalytics(@Param('schoolId') schoolId: string) {
    return this.examService.getExamAnalytics(schoolId);
  }
}
