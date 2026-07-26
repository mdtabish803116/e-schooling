import { Controller, Post, Get, Patch, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudentAdmissionsService } from '../../../../services/student/student-admissions.service';
import { StudentAdmissionDto } from '../../../../interfaces/request/student/student-admission.dto';
import { UpdateStudentDto } from '../../../../interfaces/request/student/update-student.dto';
import { BulkProgressionDto } from '../../../../interfaces/request/student/bulk-progression.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { ResourceEnum, ActionEnum, JobTypeEnum, ActionTypeEnum } from '../../../../models/enums/enums';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { QueueProducerService } from '../../../../api/worker/queues/queue-producer.service';
import { QueueNames } from '../../../../api/worker/queues/queue.constants';

@ApiTags('Student Admissions')
@ApiBearerAuth('JWT-auth')
@Controller('schools/:schoolId/students')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
export class StudentAdmissionsController {
  constructor(
    private admissionsService: StudentAdmissionsService,
    private queueProducerService: QueueProducerService,
  ) {}

  @ApiOperation({ summary: 'Admit a new student to the school' })
  @ApiResponse({ 
    status: 201, 
    description: 'Student admitted successfully',
    schema: {
      example: {
        id: '10',
        studentCode: 'SCH-BLUE-2024-001',
        firstName: 'Amit',
        lastName: 'Kumar',
        status: 'active'
      }
    }
  })
  @Post('admissions')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.CREATE)
  @Feature('STUDENT_MANAGEMENT') 
  async admitStudent(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() dto: StudentAdmissionDto
  ) {
    return this.admissionsService.admitStudent(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Get all students (optionally class/section wise)' })
  @Get()
  @Permission(ResourceEnum.STUDENTS, ActionEnum.VIEW)
  @Feature('STUDENT_MANAGEMENT')
  async getStudents(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.admissionsService.getStudents(caller, schoolId, { classId, sectionId, search, page, limit });
  }

  @ApiOperation({ summary: 'Get student by ID' })
  @Get(':studentId')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.VIEW)
  @Feature('STUDENT_MANAGEMENT')
  async getStudentById(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.admissionsService.getStudentById(caller, schoolId, studentId);
  }

  @ApiOperation({ summary: 'Update student profile' })
  @Patch(':studentId')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.UPDATE)
  @Feature('STUDENT_MANAGEMENT')
  async updateStudent(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.admissionsService.updateStudent(caller, schoolId, studentId, dto);
  }

  @ApiOperation({ summary: 'Bulk promote, demote, or repeat students' })
  @Post('progress')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.UPDATE)
  @Feature('STUDENT_MANAGEMENT')
  async bulkProgress(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() dto: BulkProgressionDto
  ) {
    let jobType: JobTypeEnum;
    if (dto.actionType === ActionTypeEnum.PROMOTION || dto.actionType === ActionTypeEnum.SPECIAL_PROMOTION) {
      jobType = JobTypeEnum.PROMOTION;
    } else if (dto.actionType === ActionTypeEnum.DEMOTION || dto.actionType === ActionTypeEnum.REPEAT) {
      jobType = JobTypeEnum.DEMOTION;
    } else {
      jobType = JobTypeEnum.SECTION_TRANSFER;
    }

    const job = await this.queueProducerService.addJob({
      queueName: QueueNames.STUDENT_PROGRESSION,
      jobType,
      payload: {
        schoolId,
        caller,
        dto,
      },
      tenantId: schoolId,
      createdBy: caller.id,
    });

    return {
      message: 'Bulk progression job successfully queued in background.',
      jobId: job.jobId,
      status: job.status,
    };
  }

  @ApiOperation({ summary: 'Update student profile photo' })
  @Patch(':studentId/photo')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.UPDATE)
  @Feature('STUDENT_MANAGEMENT')
  async updateStudentPhoto(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Body() body: { profilePicUrl: string },
  ) {
    return this.admissionsService.updateStudentPhoto(caller, schoolId, studentId, body.profilePicUrl);
  }

  @ApiOperation({ summary: 'Get student documents' })
  @Get(':studentId/documents')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.VIEW)
  @Feature('STUDENT_MANAGEMENT')
  async getStudentDocuments(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.admissionsService.getStudentDocuments(caller, schoolId, studentId);
  }

  @ApiOperation({ summary: 'Upload document for student' })
  @Post(':studentId/documents')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.UPDATE)
  @Feature('STUDENT_MANAGEMENT')
  async uploadStudentDocument(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Body() body: { file: string; type: string; name?: string; originalName?: string },
  ) {
    return this.admissionsService.uploadStudentDocument(caller, schoolId, studentId, body);
  }

  @ApiOperation({ summary: 'Delete document for student' })
  @Delete(':studentId/documents/:documentId')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.UPDATE)
  @Feature('STUDENT_MANAGEMENT')
  async deleteStudentDocument(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.admissionsService.deleteStudentDocument(caller, schoolId, studentId, documentId);
  }

  @ApiOperation({ summary: 'Seed sample students across all classes and sections for testing' })
  @Post('seed')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.CREATE)
  @Feature('STUDENT_MANAGEMENT')
  async seedStudents(
    @Param('schoolId') schoolId: string,
  ) {
    return this.admissionsService.seedStudentsForSchool(schoolId);
  }

  @ApiOperation({ summary: 'Queue bulk student CSV import via BullMQ Redis worker' })
  @Post('import-csv')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.CREATE)
  @Feature('STUDENT_MANAGEMENT')
  async importStudentsCsv(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() body: { rows: any[] },
  ) {
    const job = await this.queueProducerService.addJob({
      queueName: QueueNames.IMPORTS_EXPORTS,
      jobType: JobTypeEnum.STUDENT_IMPORT,
      payload: {
        schoolId,
        caller,
        rows: body.rows || [],
      },
      tenantId: schoolId,
      createdBy: caller.id,
    });

    return {
      message: 'Bulk student CSV import job successfully queued in background worker mode.',
      jobId: job.jobId,
      status: job.status,
    };
  }

  @ApiOperation({ summary: 'Queue bulk student CSV export via BullMQ Redis worker' })
  @Post('export-csv')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.VIEW)
  @Feature('STUDENT_MANAGEMENT')
  async exportStudentsCsv(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('search') search?: string,
  ) {
    const job = await this.queueProducerService.addJob({
      queueName: QueueNames.IMPORTS_EXPORTS,
      jobType: JobTypeEnum.EXPORT_EXCEL,
      payload: {
        schoolId,
        caller,
        classId,
        sectionId,
        search,
      },
      tenantId: schoolId,
      createdBy: caller.id,
    });

    return {
      message: 'Bulk student CSV export job successfully queued in background worker mode.',
      jobId: job.jobId,
      status: job.status,
    };
  }
}
