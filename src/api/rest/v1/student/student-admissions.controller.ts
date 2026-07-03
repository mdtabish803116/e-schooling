import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudentAdmissionsService } from '../../../../services/student/student-admissions.service';
import { StudentAdmissionDto } from '../../../../interfaces/request/student/student-admission.dto';
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
}
