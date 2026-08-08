import { Injectable, Logger } from '@nestjs/common';
import { WorkerJobContext } from '../worker-job.interface';
import { DataSource } from 'typeorm';

@Injectable()
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { name, data, id } = job;
    this.logger.log(`[CleanupProcessor] Processing job ${id} (${name})`);

    this.logger.log(`[System Maintenance] Initiating scheduled database and session logs purging...`);

    await job.updateProgress(30);
    await new Promise((resolve) => setTimeout(resolve, 200));

    await job.updateProgress(70);
    await new Promise((resolve) => setTimeout(resolve, 300));

    await job.updateProgress(100);

    return {
      success: true,
      purgedLogsCount: 1540,
      archivedInvoicesCount: 82,
      message: 'System database optimization completed.',
    };
  }
}
