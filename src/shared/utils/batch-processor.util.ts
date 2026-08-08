import { DataSource, QueryRunner } from 'typeorm';

export interface BatchProcessorOptions<T> {
  items: T[];
  batchSize?: number;
  dataSource: DataSource;
  onProgress?: (processedCount: number, totalCount: number, percentage: number) => Promise<void>;
  processBatch: (chunk: T[], queryRunner: QueryRunner) => Promise<void>;
}

/**
 * Utility for running chunked batch processing inside PostgreSQL transactions.
 * Enforces per-batch "All-or-Nothing" atomicity with optional idempotency/UPSERT handling.
 */
export async function processInBatches<T>(options: BatchProcessorOptions<T>): Promise<{
  totalProcessed: number;
  batchCount: number;
}> {
  const { items, batchSize = 250, dataSource, onProgress, processBatch } = options;
  const total = items.length;
  let processedCount = 0;
  let batchCount = 0;

  if (total === 0) {
    if (onProgress) await onProgress(0, 0, 100);
    return { totalProcessed: 0, batchCount: 0 };
  }

  for (let i = 0; i < total; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await processBatch(chunk, queryRunner);
      await queryRunner.commitTransaction();
      processedCount += chunk.length;
      batchCount++;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    if (onProgress) {
      const percentage = Math.round((processedCount / total) * 100);
      await onProgress(processedCount, total, percentage);
    }
  }

  return { totalProcessed: processedCount, batchCount };
}
