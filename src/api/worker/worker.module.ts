import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from '../../core/database/postgres/create-typeorm';
import { QueueModule } from './queues/queue.module';
import { QueueConsumerService } from './queues/queue-consumer.service';
import { NotificationProcessor } from './processors/notification.processor';
import { ImportExportProcessor } from './processors/import-export/import-export.processor';
import { StudentImportProcessor } from './processors/import-export/student-import.processor';
import { StudentExportProcessor } from './processors/import-export/student-export.processor';
import { StaffExportProcessor } from './processors/import-export/staff-export.processor';
import { ClassExportProcessor } from './processors/import-export/class-export.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { PaymentReconciliationProcessor } from './processors/payment-reconciliation.processor';
import { StudentProgressionProcessor } from './processors/student-progression.processor';
import { BackgroundJobService } from './background-job.service';
import { SubscriptionModule } from '../rest/v1/subscription/subscription.module';
import { StudentModule } from '../rest/v1/student/student.module';
import { ImportExportModule } from '../rest/v1/import-export/import-export.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
    SubscriptionModule,
    QueueModule,
    StudentModule,
    ImportExportModule,
  ],
  providers: [
    QueueConsumerService,
    NotificationProcessor,
    ImportExportProcessor,
    StudentImportProcessor,
    StudentExportProcessor,
    StaffExportProcessor,
    ClassExportProcessor,
    CleanupProcessor,
    PaymentReconciliationProcessor,
    StudentProgressionProcessor,
    BackgroundJobService,
  ],
  exports: [BackgroundJobService],
})
export class WorkerModule {}
