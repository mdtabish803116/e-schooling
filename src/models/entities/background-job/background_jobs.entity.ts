import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { JobTypeEnum, JobStatusEnum } from '../../enums/enums';

@Entity({ name: 'background_jobs', schema: 'e_schooling' })
export class BackGroundJob {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index({ unique: true })
  @Column({
    name: 'job_id',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'BullMQ unique Job ID',
  })
  jobId: string;

  @Index()
  @Column({
    name: 'queue_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Target queue name',
  })
  queueName: string;

  @Index()
  @Column({
    name: 'job_type',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Job Type action mapping',
  })
  jobType: JobTypeEnum;

  @Index()
  @Column({
    name: 'status',
    type: 'varchar',
    length: 50,
    default: JobStatusEnum.PENDING,
    comment: 'Current job execution status',
  })
  status: JobStatusEnum;

  @Column({
    name: 'payload',
    type: 'jsonb',
    nullable: true,
    comment: 'Input parameter parameters payload',
  })
  payload: Record<string, unknown> | null;

  @Column({
    name: 'response',
    type: 'jsonb',
    nullable: true,
    comment: 'Successful execution result response',
  })
  response: Record<string, unknown> | null;

  @Column({
    name: 'error',
    type: 'jsonb',
    nullable: true,
    comment: 'Failure error stack and logs',
  })
  error: Record<string, unknown> | null;

  @Column({
    name: 'attempts',
    type: 'integer',
    default: 0,
    comment: 'Total attempts made to run the job',
  })
  attempts: number;

  @Column({
    name: 'max_attempts',
    type: 'integer',
    default: 3,
    comment: 'Maximum retry threshold ceiling',
  })
  maxAttempts: number;

  @Column({
    name: 'progress',
    type: 'integer',
    default: 0,
    comment: 'Progress metrics between 0 and 100',
  })
  progress: number;

  @Column({
    name: 'priority',
    type: 'integer',
    default: 0,
    comment: 'Execution priority rating',
  })
  priority: number;

  @Column({
    name: 'delay',
    type: 'integer',
    default: 0,
    comment: 'Execution delay interval length in milliseconds',
  })
  delay: number;

  @Column({
    name: 'cron_expression',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cron pattern if reproducible task',
  })
  cronExpression: string | null;

  @Index()
  @Column({
    name: 'tenant_id',
    type: 'bigint',
    nullable: true,
    comment: 'School context binding ID',
  })
  tenantId: string | null;

  @Index()
  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true,
    comment: 'User index triggering task creation',
  })
  createdBy: string | null;

  @Column({
    name: 'metadata',
    type: 'jsonb',
    nullable: true,
    comment: 'Custom audit and execution context fields',
  })
  metadata: Record<string, unknown> | null;

  @Column({
    name: 'scheduled_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Time job is scheduled to execute',
  })
  scheduledAt: Date | null;

  @Column({
    name: 'processed_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Time processing actually starts',
  })
  processedAt: Date | null;

  @Column({
    name: 'completed_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Completion confirmation time',
  })
  completedAt: Date | null;

  @Column({
    name: 'failed_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Failure trigger time',
  })
  failedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Creation date',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Last updated time',
  })
  updatedAt: Date;
}
