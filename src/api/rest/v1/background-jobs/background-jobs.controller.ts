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

@ApiTags('Background Jobs')
@ApiBearerAuth('JWT-auth')
@Controller('schools/:schoolId/background-jobs')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
export class BackgroundJobsController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly queueProducerService: QueueProducerService,
  ) {}

  @ApiOperation({
    summary: 'Get all background jobs for a school',
  })
  @Get()
  async getAllJobs(
    @Param('schoolId') schoolId: string,
    @Query('jobType') jobType?: JobTypeEnum,
    @Query('queueName') queueName?: string,
  ) {
    const jobRepo = this.dataSource.getRepository(BackGroundJob);

    const query = jobRepo
      .createQueryBuilder('job')
      .where('job.tenantId = :schoolId', { schoolId })
      .orderBy('job.createdAt', 'DESC')
      .limit(50);

    if (jobType) {
      query.andWhere('job.jobType = :jobType', { jobType });
    }

    if (queueName) {
      query.andWhere('job.queueName = :queueName', { queueName });
    }

    const jobs = await query.getMany();

    return {
      success: true,
      data: jobs.map((job) => ({
        id: job.id,
        jobId: job.jobId,
        queueName: job.queueName,
        jobType: job.jobType,
        status: job.status,
        progress: job.progress,
        payload: job.payload,
        response: job.response,
        error: job.error,
        createdAt: job.createdAt,
      })),
    };
  }

  @ApiOperation({
    summary: 'Get background job progress & output result',
  })
  @Get(':jobId')
  async getJobStatus(
    @Param('schoolId') schoolId: string,
    @Param('jobId') jobId: string,
  ) {
    const jobRepo = this.dataSource.getRepository(BackGroundJob);
    const whereClauses: any[] = [{ jobId, tenantId: schoolId }];

    // Only query by 'id' (bigint) if the provided jobId is numeric
    if (/^\d+$/.test(jobId)) {
      whereClauses.push({ id: jobId, tenantId: schoolId });
    }

    const job = await jobRepo.findOne({
      where: whereClauses,
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
