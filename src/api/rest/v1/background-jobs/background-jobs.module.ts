import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackgroundJobsController } from './background-jobs.controller';
import { QueueModule } from '../../../worker/queues/queue.module';
import { EntitlementModule } from '../entitlement/entitlement.module';
import { RBACModule } from '../school-roles/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    QueueModule,
    EntitlementModule,
    RBACModule,
  ],
  controllers: [BackgroundJobsController],
  providers: [],
  exports: [],
})
export class BackgroundJobsModule {}
