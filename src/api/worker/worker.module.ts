import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createOrmConfig } from '../../core/database/postgres/create-typeorm';
import { QueueModule } from './queues/queue.module';
import { QueueConsumerService } from './queues/queue-consumer.service';
import { PgPubSubService } from './pg-pubsub/pg-pubsub.service';
import { NotificationProcessor } from './processors/notification.processor';
import { ImportExportProcessor } from './processors/import-export/import-export.processor';
import { StudentImportProcessor } from './processors/import-export/student-import.processor';
import { StudentExportProcessor } from './processors/import-export/student-export.processor';
import { StaffExportProcessor } from './processors/import-export/staff-export.processor';
import { ClassExportProcessor } from './processors/import-export/class-export.processor';
import { PaymentReconciliationProcessor } from './processors/payment-reconciliation.processor';
import { StudentProgressionProcessor } from './processors/student-progression.processor';
import { SessionCopyProcessor } from './processors/academic/session-copy.processor';
import { BackgroundJobService } from './background-job.service';
import { SubscriptionModule } from '../rest/v1/subscription/subscription.module';
import { StudentModule } from '../rest/v1/student/student.module';
import { StorageModule } from '../../modules/storage/storage.module';
import { AcademicModule } from '../rest/v1/academic/academic.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => createOrmConfig(),
    }),
    SubscriptionModule,
    QueueModule,
    StudentModule,
    StorageModule,
    AcademicModule,
  ],
  providers: [
    PgPubSubService,
    QueueConsumerService,
    NotificationProcessor,
    ImportExportProcessor,
    StudentImportProcessor,
    StudentExportProcessor,
    StaffExportProcessor,
    ClassExportProcessor,
    PaymentReconciliationProcessor,
    StudentProgressionProcessor,
    SessionCopyProcessor,
    BackgroundJobService,
  ],
  exports: [BackgroundJobService, PgPubSubService],
})
export class WorkerModule {}
