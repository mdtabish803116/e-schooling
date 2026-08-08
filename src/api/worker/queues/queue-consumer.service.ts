import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Config } from '../../../config/index';
import {
  PgPubSubService,
  PgJobNotification,
} from '../pg-pubsub/pg-pubsub.service';
import { QueueNames } from './queue.constants';
import { BackGroundJob } from '../../../models/entities/background-job/background_jobs.entity';
import { JobStatusEnum, JobTypeEnum } from '../../../models/enums/enums';
import { WorkerJobContext } from '../worker-job.interface';
import { NotificationProcessor } from '../processors/notification.processor';
import { ImportExportProcessor } from '../processors/import-export/import-export.processor';
import { PaymentReconciliationProcessor } from '../processors/payment-reconciliation.processor';
import { StudentProgressionProcessor } from '../processors/student-progression.processor';
import { QueueProducerService } from './queue-producer.service';

@Injectable()
export class QueueConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueConsumerService.name);
  private pollingIntervalHandle: NodeJS.Timeout | null = null;
  private isProcessingLoopActive = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly pgPubSubService: PgPubSubService,
    private readonly notificationProcessor: NotificationProcessor,
    private readonly importExportProcessor: ImportExportProcessor,
    private readonly paymentReconciliationProcessor: PaymentReconciliationProcessor,
    private readonly studentProgressionProcessor: StudentProgressionProcessor,
    private readonly queueProducerService: QueueProducerService,
  ) {}

  async onModuleInit() {
    const serverMode = Config.getSecret('SERVER_MODE', String) || 'rest';

    if (serverMode !== 'worker') {
      this.logger.log(
        '[QueueConsumerService] Running in API Mode. Skipping background worker subscriber.',
      );
      return;
    }

    this.logger.log(
      '[QueueConsumerService] Booting in Worker Mode. Initializing PostgreSQL Pub/Sub & Outbox Consumer.',
    );

    // 1. Subscribe to real-time LISTEN/NOTIFY signals from PostgreSQL
    this.pgPubSubService.subscribe((_notification: PgJobNotification) => {
      // Trigger instant processing pass
      void this.pollNextJobAndProcess();
    });

    // 2. Start a safety fallback ticker (every 5 seconds) to pick up missed or delayed PENDING tasks
    this.pollingIntervalHandle = setInterval(() => {
      void this.pollNextJobAndProcess();
    }, 5000);

    // 3. Register the Repeatable Payment Reconciliation Cron Task to execute every 2 hours
    try {
      this.logger.log(
        '[QueueConsumerService] Scheduling payment reconciliation task to execute every 2 hours...',
      );

      await this.queueProducerService.addJob({
        queueName: QueueNames.RECONCILIATION,
        jobType: JobTypeEnum.PAYMENT_RECONCILIATION,
        payload: { source: 'scheduler' },
        cronExpression: '0 */2 * * *',
      });
    } catch (err: any) {
      this.logger.error(
        `[QueueConsumerService] Failed to schedule payment reconciliation task: ${err.message}`,
      );
    }

    // Trigger initial poll
    void this.pollNextJobAndProcess();
  }

  /**
   * Fetches the next available PENDING/RETRYING job using FOR UPDATE SKIP LOCKED for multi-worker safety
   */
  private async pollNextJobAndProcess(): Promise<void> {
    if (this.isProcessingLoopActive) return;
    this.isProcessingLoopActive = true;

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let targetJob: BackGroundJob | null = null;
      try {
        const rawJobs = await queryRunner.query(`
          SELECT * FROM "e_schooling"."background_jobs"
          WHERE status IN ('pending', 'retrying')
            AND (scheduled_at IS NULL OR scheduled_at <= NOW())
          ORDER BY priority DESC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `);

        if (rawJobs && rawJobs.length > 0) {
          const rawJob = rawJobs[0];
          targetJob = await queryRunner.manager.findOne(BackGroundJob, {
            where: { id: String(rawJob.id) },
          });

          if (targetJob) {
            targetJob.status = JobStatusEnum.ACTIVE;
            targetJob.processedAt = new Date();
            targetJob.attempts = (targetJob.attempts || 0) + 1;
            await queryRunner.manager.save(BackGroundJob, targetJob);
          }
        }

        await queryRunner.commitTransaction();
      } catch (err: any) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Error locking background job in outbox poll: ${err.message}`,
        );
      } finally {
        await queryRunner.release();
      }

      if (targetJob) {
        await this.executeJob(targetJob);
      }
    } catch (err: any) {
      this.logger.error(
        `[QueueConsumerService] Poll loop error: ${err.message}`,
      );
    } finally {
      this.isProcessingLoopActive = false;
    }
  }

  /**
   * Dispatches locked job to processor routine and persists execution results/progress
   */
  private async executeJob(job: BackGroundJob): Promise<void> {
    this.logger.log(
      `[Worker] Starting execution for Job ${job.jobId} (Queue: ${job.queueName}, Type: ${job.jobType})`,
    );

    const dbRepo = this.dataSource.getRepository(BackGroundJob);

    const jobContext: WorkerJobContext = {
      id: job.jobId,
      jobType: job.jobType,
      queueName: job.queueName,
      data: job.payload || {},
      attemptsMade: job.attempts,
      maxAttempts: job.maxAttempts || 3,
      updateProgress: async (progress: number) => {
        try {
          await dbRepo.update({ id: job.id }, { progress });
        } catch (err: any) {
          this.logger.error(
            `Failed to update progress for job ${job.jobId}: ${err.message}`,
          );
        }
      },
    };

    try {
      let result: any = null;

      if (job.queueName === QueueNames.NOTIFICATIONS) {
        result = await this.notificationProcessor.process(jobContext);
      } else if (
        job.queueName === QueueNames.IMPORT ||
        job.queueName === QueueNames.EXPORT
      ) {
        result = await this.importExportProcessor.process(jobContext);
      } else if (job.queueName === QueueNames.RECONCILIATION) {
        result = await this.paymentReconciliationProcessor.process(jobContext);
      } else if (job.queueName === QueueNames.STUDENT_PROGRESSION) {
        result = await this.studentProgressionProcessor.process(jobContext);
      } else {
        throw new Error(`Unregistered worker queue: ${job.queueName}`);
      }

      // Mark Job as COMPLETED
      job.status = JobStatusEnum.COMPLETED;
      job.progress = 100;
      job.completedAt = new Date();
      job.response =
        typeof result === 'object' && result !== null ? result : { result };
      await dbRepo.save(job);
      this.logger.log(`[Worker] Job ${job.jobId} COMPLETED successfully!`);
    } catch (err: any) {
      this.logger.error(
        `[Worker] Job ${job.jobId} FAILED: ${err.message}`,
        err.stack,
      );

      const attemptsMade = job.attempts;
      const maxAttempts = job.maxAttempts || 3;
      const isRetrying = attemptsMade < maxAttempts;

      job.status = isRetrying ? JobStatusEnum.RETRYING : JobStatusEnum.FAILED;
      job.failedAt = new Date();
      job.error = { message: err.message, stack: err.stack, attemptsMade };

      if (isRetrying) {
        // Schedule next retry with exponential backoff delay (5s * attempts)
        const delayMs = 5000 * attemptsMade;
        job.scheduledAt = new Date(Date.now() + delayMs);
      }

      await dbRepo.save(job);
    }
  }

  async onModuleDestroy() {
    this.logger.log('[QueueConsumerService] Stopping worker polling ticker...');
    if (this.pollingIntervalHandle) {
      clearInterval(this.pollingIntervalHandle);
    }
  }
}
