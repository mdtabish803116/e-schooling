import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PgPubSubService } from '../pg-pubsub/pg-pubsub.service';
import { BackGroundJob } from '../../../models/entities/background-job/background_jobs.entity';
import { JobTypeEnum, JobStatusEnum } from '../../../models/enums/enums';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly pgPubSubService: PgPubSubService,
  ) {}

  /**
   * Adds a highly auditable job to PostgreSQL outbox, saving record and dispatching NOTIFY signal
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
    const dbJobRepo = this.dataSource.getRepository(BackGroundJob);

    // Unique Job ID format
    const dbJobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Save PENDING Job into PostgreSQL Outbox Table
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
      `Created PENDING Outbox job ${dbJobId} for queue ${queueName} in PostgreSQL`,
    );

    // Emit PostgreSQL NOTIFY signal for instant background worker execution
    try {
      await this.pgPubSubService.notifyJobCreated({
        jobId: dbJobId,
        queueName,
        jobType,
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to publish NOTIFY event for Job ${dbJobId}: ${err.message}`,
        err.stack,
      );
    }

    return savedJob;
  }
}
