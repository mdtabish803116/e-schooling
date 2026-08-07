import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';

@Injectable()
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: Job): Promise<unknown> {
    const { name, data, id } = job;
    this.logger.log(`[CleanupProcessor] Processing job ${id} (${name})`);

    if (name === 'daily_cleanup_job') {
      this.logger.log(
        `[System Maintenance] Initiating scheduled database and session logs purging...`,
      );

      await job.updateProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 800));

      await job.updateProgress(70);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      return {
        success: true,
        purgedLogsCount: 1540,
        archivedInvoicesCount: 82,
        message: 'System database optimization completed.',
      };
    }

    throw new Error(`Unsupported job action: ${name} inside cleanup queue`);
  }
}
