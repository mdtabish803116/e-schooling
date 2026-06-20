import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from '../../core/database/postgres/create-typeorm';
import { QueueModule } from './queues/queue.module';
import { QueueConsumerService } from './queues/queue-consumer.service';
import { NotificationProcessor } from './processors/notification.processor';
import { ImportExportProcessor } from './processors/import-export.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { PaymentReconciliationProcessor } from './processors/payment-reconciliation.processor';
import { StudentProgressionProcessor } from './processors/student-progression.processor';
import { BackgroundJobService } from './background-job.service';
import { SubscriptionModule } from '../rest/v1/subscription/subscription.module';
import { StudentModule } from '../rest/v1/student/student.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
    SubscriptionModule,
    QueueModule,
    StudentModule,
  ],
  providers: [
    QueueConsumerService,
    NotificationProcessor,
    ImportExportProcessor,
    CleanupProcessor,
    PaymentReconciliationProcessor,
    StudentProgressionProcessor,
    BackgroundJobService,
  ],
  exports: [BackgroundJobService],
})
export class WorkerModule {}


