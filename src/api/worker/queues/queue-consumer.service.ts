import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { Config } from '../../../config/index';
import { RedisConnectionService } from '../redis/redis-connection.service';
import { QueueNames } from './queue.constants';
import { BackGroundJob } from '../../../models/entities/background-job/background_jobs.entity';
import { JobStatusEnum, JobTypeEnum } from '../../../models/enums/enums';
import { NotificationProcessor } from '../processors/notification.processor';
import { ImportExportProcessor } from '../processors/import-export/import-export.processor';
import { CleanupProcessor } from '../processors/cleanup.processor';
import { PaymentReconciliationProcessor } from '../processors/payment-reconciliation.processor';
import { StudentProgressionProcessor } from '../processors/student-progression.processor';
import { QueueProducerService } from './queue-producer.service';

@Injectable()
export class QueueConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueConsumerService.name);
  private readonly workersList: Worker[] = [];

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisConnectionService: RedisConnectionService,
    private readonly notificationProcessor: NotificationProcessor,
    private readonly importExportProcessor: ImportExportProcessor,
    private readonly cleanupProcessor: CleanupProcessor,
    private readonly paymentReconciliationProcessor: PaymentReconciliationProcessor,
    private readonly studentProgressionProcessor: StudentProgressionProcessor,
    private readonly queueProducerService: QueueProducerService,
  ) {}

  async onModuleInit() {
    const serverMode = Config.getSecret('SERVER_MODE', String) || 'rest';

    if (serverMode !== 'worker') {
      this.logger.log(
        '[QueueConsumerService] Running in API Mode. Skipping background worker boots.',
      );
      return;
    }

    this.logger.log(
      '[QueueConsumerService] Booting in worker mode... Initializing BullMQ queues and workers.',
    );

    // 1. Initialize Notification Queue Worker
    this.createWorker(QueueNames.NOTIFICATIONS, async (job) => {
      return this.notificationProcessor.process(job);
    });

    // 2. Initialize Import/Export Queue Worker
    this.createWorker(QueueNames.IMPORTS_EXPORTS, async (job) => {
      return this.importExportProcessor.process(job);
    });

    // 3. Initialize Maintenance/Cleanup Queue Worker
    this.createWorker(QueueNames.CLEANUP, async (job) => {
      if (job.name === JobTypeEnum.PAYMENT_RECONCILIATION) {
        return this.paymentReconciliationProcessor.process(job);
      }
      return this.cleanupProcessor.process(job);
    });

    // 4. Initialize Student Progression Queue Worker
    this.createWorker(QueueNames.STUDENT_PROGRESSION, async (job) => {
      return this.studentProgressionProcessor.process(job);
    });

    // 5. Register the Repeatable Payment Reconciliation Cron Task: Runs every 2 hours
    try {
      this.logger.log(
        '[QueueConsumerService] Scheduling payment reconciliation task to execute every 2 hours...',
      );
      await this.queueProducerService.addJob({
        queueName: QueueNames.CLEANUP,
        jobType: JobTypeEnum.PAYMENT_RECONCILIATION,
        payload: { source: 'scheduler' },
        cronExpression: '0 */2 * * *', // Run every 2 hours
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      this.logger.error(
        `[QueueConsumerService] Failed to schedule payment reconciliation task: ${errorObj.message}`,
      );
    }
  }

  /**
   * Universal helper to instantiate a BullMQ worker with database status listeners hooked in
   */
  private createWorker(
    queueName: string,
    processCallback: (job: Job) => Promise<unknown>,
  ): void {
    const connection = this.redisConnectionService.getConnection();

    const worker = new Worker(queueName, processCallback, {
      connection,
      concurrency: 5, // Concurrent tasks per queue
    });

    // Event Hook: Active / Processing Started
    worker.on('active', async (job) => {
      const jobId = job.id;
      this.logger.log(
        `[Queue: ${queueName}] Job ${jobId} status transitioned to ACTIVE`,
      );

      await this.updateJobInDB(jobId!, {
        status: JobStatusEnum.ACTIVE,
        processedAt: new Date(),
        attempts: job.attemptsMade,
      });
    });

    // Event Hook: Progress Metric Updated
    worker.on('progress', async (job, progress: number | object) => {
      const jobId = job.id;
      const progressValue = typeof progress === 'number' ? progress : 0;
      this.logger.debug(
        `[Queue: ${queueName}] Job ${jobId} updated progress: ${progressValue}%`,
      );

      await this.updateJobInDB(jobId!, {
        progress: progressValue,
      });
    });

    // Event Hook: Completed Successfully
    worker.on('completed', async (job, result) => {
      const jobId = job.id;
      this.logger.log(
        `[Queue: ${queueName}] Job ${jobId} COMPLETED successfully!`,
      );

      await this.updateJobInDB(jobId!, {
        status: JobStatusEnum.COMPLETED,
        progress: 100,
        completedAt: new Date(),
        response:
          typeof result === 'object'
            ? (result as Record<string, unknown>)
            : { result },
      });
    });

    // Event Hook: Failed
    worker.on('failed', async (job, err) => {
      const jobId = job?.id || 'unknown';
      this.logger.error(
        `[Queue: ${queueName}] Job ${jobId} FAILED: ${err.message}`,
        err.stack,
      );

      if (job) {
        const isRetrying = job.attemptsMade < (job.opts.attempts || 3);
        await this.updateJobInDB(jobId, {
          status: isRetrying ? JobStatusEnum.RETRYING : JobStatusEnum.FAILED,
          failedAt: new Date(),
          error: {
            message: err.message,
            stack: err.stack,
            attemptsMade: job.attemptsMade,
          },
        });
      }
    });

    this.workersList.push(worker);
  }

  private async updateJobInDB(
    jobId: string,
    data: Partial<BackGroundJob>,
  ): Promise<void> {
    try {
      const dbJobRepo = this.dataSource.getRepository(BackGroundJob);
      const job = await dbJobRepo.findOne({ where: { jobId } });
      if (job) {
        Object.assign(job, data);
        await dbJobRepo.save(job);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      this.logger.error(
        `Failed to update DB audit ledger for JobId ${jobId}: ${errorObj.message}`,
      );
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down background workers list...');
    await Promise.all(this.workersList.map((worker) => worker.close()));
  }
}
