import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { DataSource } from 'typeorm';
import { RedisConnectionService } from '../redis/redis-connection.service';
import { BackGroundJob } from '../../../models/entities/background-job/background_jobs.entity';
import { JobTypeEnum, JobStatusEnum } from '../../../models/enums/enums';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);
  private readonly queuesMap = new Map<string, Queue>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisConnectionService: RedisConnectionService,
  ) {}

  /**
   * Lazy load or fetch cached BullMQ Queue client
   */
  private getOrCreateQueue(queueName: string): Queue {
    if (this.queuesMap.has(queueName)) {
      return this.queuesMap.get(queueName)!;
    }

    const queue = new Queue(queueName, {
      connection: this.redisConnectionService.getConnection(),
    });

    this.queuesMap.set(queueName, queue);
    return queue;
  }

  /**
   * Adds a highly auditable job to the designated queue, automatically saving it to postgres first
   */
  async addJob({
    queueName,
    jobType,
    payload,
    delayMs = 0,
    priority = 0,
    cronExpression,
    tenantId,
    createdBy,
  }: {
    queueName: string;
    jobType: JobTypeEnum;
    payload: Record<string, unknown>;
    delayMs?: number;
    priority?: number;
    cronExpression?: string;
    tenantId?: string;
    createdBy?: string;
  }): Promise<BackGroundJob> {
    const queue = this.getOrCreateQueue(queueName);
    const dbJobRepo = this.dataSource.getRepository(BackGroundJob);

    // Generate unique jobId matching BullMQ structure
    const dbJobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create Database Log Audit
    const globalJob = dbJobRepo.create({
      jobId: dbJobId,
      queueName,
      jobType,
      status: JobStatusEnum.PENDING,
      payload,
      attempts: 0,
      maxAttempts: 3,
      delay: delayMs,
      priority,
      cronExpression,
      tenantId,
      createdBy,
      scheduledAt: delayMs > 0 ? new Date(Date.now() + delayMs) : new Date(),
    });

    const savedJob = await dbJobRepo.save(globalJob);
    this.logger.log(
      `Created PENDING DB log entry for job ${dbJobId} under queue ${queueName}`,
    );

    // BullMQ specific Options
    const bullmqOpts: JobsOptions = {
      jobId: dbJobId,
      delay: delayMs,
      priority: priority > 0 ? priority : undefined,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { age: 3600 * 24 }, // Cleanup completed jobs from Redis after 24 hrs
      removeOnFail: { age: 3600 * 24 * 7 }, // Cleanup failed jobs from Redis after 7 days
    };

    if (cronExpression) {
      bullmqOpts.repeat = { pattern: cronExpression };
    }

    try {
      await queue.add(jobType, payload, bullmqOpts);
      this.logger.log(
        `Dispatched Job ${dbJobId} to BullMQ queue: ${queueName}`,
      );
    } catch (err: unknown) {
      const errorObj = err as Error;
      this.logger.error(
        `Failed to publish Job ${dbJobId} to BullMQ: ${errorObj.message}`,
        errorObj.stack,
      );
      savedJob.status = JobStatusEnum.FAILED;
      savedJob.failedAt = new Date();
      savedJob.error = { message: errorObj.message, stack: errorObj.stack };
      await dbJobRepo.save(savedJob);
      throw err;
    }

    return savedJob;
  }
}
