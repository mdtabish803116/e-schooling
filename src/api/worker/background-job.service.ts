import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueueProducerService } from './queues/queue-producer.service';
import { PgPubSubService } from './pg-pubsub/pg-pubsub.service';
import { BackGroundJob } from '../../models/entities/background-job/background_jobs.entity';
import { JobTypeEnum, JobStatusEnum } from '../../models/enums/enums';

@Injectable()
export class BackgroundJobService {
  private readonly logger = new Logger(BackgroundJobService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly queueProducerService: QueueProducerService,
    private readonly pgPubSubService: PgPubSubService,
  ) {}

  /**
   * Adds an immediate execution job
   */
  async addJob(params: {
    queueName: string;
    jobType: JobTypeEnum;
    payload: Record<string, unknown>;
    tenantId?: string;
    createdBy?: string;
    priority?: number;
  }): Promise<BackGroundJob> {
    return this.queueProducerService.addJob({
      ...params,
      delayMs: 0,
    });
  }

  /**
   * Adds a delayed execution job
   */
  async addDelayedJob(params: {
    queueName: string;
    jobType: JobTypeEnum;
    payload: Record<string, unknown>;
    delayMs: number;
    tenantId?: string;
    createdBy?: string;
    priority?: number;
  }): Promise<BackGroundJob> {
    return this.queueProducerService.addJob(params);
  }

  /**
   * Adds a recurring cron task
   */
  async addCronJob(params: {
    queueName: string;
    jobType: JobTypeEnum;
    payload: Record<string, unknown>;
    cronExpression: string;
    tenantId?: string;
    createdBy?: string;
  }): Promise<BackGroundJob> {
    return this.queueProducerService.addJob({
      ...params,
      delayMs: 0,
    });
  }

  /**
   * Fetches job state from DB audit ledger
   */
  async getJobStatus(jobId: string): Promise<BackGroundJob> {
    const job = await this.dataSource
      .getRepository(BackGroundJob)
      .findOne({ where: { jobId } });
    if (!job) {
      throw new NotFoundException(
        `Background Job record ${jobId} not found in system.`,
      );
    }
    return job;
  }

  /**
   * Cancels a pending or active job from the PostgreSQL outbox
   */
  async cancelJob(jobId: string): Promise<void> {
    const dbJobRepo = this.dataSource.getRepository(BackGroundJob);
    const job = await dbJobRepo.findOne({ where: { jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found.`);

    job.status = JobStatusEnum.CANCELLED;
    job.failedAt = new Date();
    job.error = { message: 'Job cancelled by user request' };
    await dbJobRepo.save(job);
    this.logger.log(`Cancelled Job ${jobId} in PostgreSQL Outbox ledger.`);
  }

  /**
   * Retries a failed job by resetting status to PENDING and emitting NOTIFY signal
   */
  async retryJob(jobId: string): Promise<BackGroundJob> {
    const dbJobRepo = this.dataSource.getRepository(BackGroundJob);
    const job = await dbJobRepo.findOne({ where: { jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found.`);

    if (
      job.status !== JobStatusEnum.FAILED &&
      job.status !== JobStatusEnum.CANCELLED
    ) {
      throw new Error(
        `Only FAILED or CANCELLED jobs can be retried. Current status: ${job.status}`,
      );
    }

    this.logger.log(
      `Re-queueing Job ${jobId} (Type: ${job.jobType}) on queue ${job.queueName}`,
    );

    // Update job to PENDING again and retry
    job.status = JobStatusEnum.PENDING;
    job.attempts = 0;
    job.progress = 0;
    job.error = null;
    job.response = null;
    job.scheduledAt = new Date();
    const updatedJob = await dbJobRepo.save(job);

    await this.pgPubSubService.notifyJobCreated({
      jobId: updatedJob.jobId,
      queueName: updatedJob.queueName,
      jobType: updatedJob.jobType,
    });

    return updatedJob;
  }
}
