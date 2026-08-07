import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { QueueProducerService } from '../../../../api/worker/queues/queue-producer.service';
import { QueueNames } from '../../../../api/worker/queues/queue.constants';
import {
  JobTypeEnum,
  ResourceEnum,
  ActionEnum,
} from '../../../../models/enums/enums';
import { BackGroundJob } from '../../../../models/entities/background-job/background_jobs.entity';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('Generic Import & Export Engine')
@ApiBearerAuth('JWT-auth')
@Controller('schools/:schoolId/import-export')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
export class ImportExportController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly queueProducerService: QueueProducerService,
  ) {}

  @ApiOperation({
    summary: 'Trigger generic export for ANY entity/table via BullMQ worker',
  })
  @Post('export')
  @Permission(ResourceEnum.REPORTS, ActionEnum.VIEW)
  async triggerExport(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body()
    body: {
      entityName: string;
      queueName?: string;
      jobType?: JobTypeEnum;
      filters?: Record<string, any>;
    },
  ) {
    const queueName = body.queueName || QueueNames.IMPORTS_EXPORTS;
    const jobType = body.jobType || JobTypeEnum.GENERIC_EXPORT;

    const job = await this.queueProducerService.addJob({
      queueName,
      jobType,
      payload: {
        schoolId,
        caller,
        entityName: body.entityName,
        payload: body.filters || {},
      },
      tenantId: schoolId,
      createdBy: caller.id,
    });

    return {
      message: `Export job for '${body.entityName}' successfully queued in background worker mode.`,
      jobId: job.jobId,
      status: job.status,
      queueName,
      jobType,
    };
  }

  @ApiOperation({
    summary: 'Trigger generic import for ANY entity/table via BullMQ worker',
  })
  @Post('import')
  @Permission(ResourceEnum.STUDENTS, ActionEnum.CREATE)
  async triggerImport(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body()
    body: {
      entityName: string;
      rows: any[];
      queueName?: string;
      jobType?: JobTypeEnum;
    },
  ) {
    const queueName = body.queueName || QueueNames.IMPORTS_EXPORTS;
    const jobType = body.jobType || JobTypeEnum.GENERIC_IMPORT;

    const job = await this.queueProducerService.addJob({
      queueName,
      jobType,
      payload: {
        schoolId,
        caller,
        entityName: body.entityName,
        rows: body.rows || [],
      },
      tenantId: schoolId,
      createdBy: caller.id,
    });

    return {
      message: `Import job for '${body.entityName}' (${body.rows?.length || 0} rows) successfully queued in background worker mode.`,
      jobId: job.jobId,
      status: job.status,
      queueName,
      jobType,
    };
  }

  @ApiOperation({
    summary: 'Get background import/export job progress & output result',
  })
  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('schoolId') schoolId: string,
    @Param('jobId') jobId: string,
  ) {
    const jobRepo = this.dataSource.getRepository(BackGroundJob);
    const job = await jobRepo.findOne({
      where: [
        { jobId, tenantId: schoolId },
        { id: jobId, tenantId: schoolId },
      ],
    });

    if (!job) {
      throw new NotFoundException(
        `Background job with ID '${jobId}' not found for this school.`,
      );
    }

    return {
      id: job.id,
      jobId: job.jobId,
      queueName: job.queueName,
      jobType: job.jobType,
      status: job.status,
      progress: job.progress,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      payload: job.payload,
      response: job.response,
      error: job.error,
      scheduledAt: job.scheduledAt,
      processedAt: job.processedAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      createdAt: job.createdAt,
    };
  }
}
