import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from '../../core/database/postgres/create-typeorm';
import { RedisConnectionService } from './redis/redis-connection.service';
import { QueueProducerService } from './queues/queue-producer.service';
import { QueueConsumerService } from './queues/queue-consumer.service';
import { NotificationProcessor } from './processors/notification.processor';
import { ImportExportProcessor } from './processors/import-export.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { PaymentReconciliationProcessor } from './processors/payment-reconciliation.processor';
import { BackgroundJobService } from './background-job.service';
import { SubscriptionModule } from '../rest/v1/subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
    SubscriptionModule,
  ],
  providers: [
    RedisConnectionService,
    QueueProducerService,
    QueueConsumerService,
    NotificationProcessor,
    ImportExportProcessor,
    CleanupProcessor,
    PaymentReconciliationProcessor,
    BackgroundJobService,
  ],
  exports: [BackgroundJobService],
})
export class WorkerModule {}
