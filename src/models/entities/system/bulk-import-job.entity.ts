import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { JobTypeEnum, JobStatusEnum } from '../../enums/enums';

@Entity({ name: 'bulk_import_jobs', schema: 'e_schooling' })
export class BulkImportJob {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'job_type', type: 'varchar', nullable: true, comment: 'student_import | promotion | demotion | section_transfer' })
  jobType: JobTypeEnum;

  @Column({ name: 'file_url', type: 'varchar', nullable: true, comment: 'Import file URL' })
  fileUrl: string;

  @Column({ name: 'total_records', type: 'integer', nullable: true, comment: 'Total records to process' })
  totalRecords: number;

  @Column({ name: 'processed_records', type: 'integer', nullable: true, comment: 'Records processed successfully' })
  processedRecords: number;

  @Column({ name: 'failed_records', type: 'integer', nullable: true, comment: 'Records failed' })
  failedRecords: number;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'pending | processing | completed | failed' })
  status: JobStatusEnum;

  @Index()
  @Column({ name: 'uploaded_by', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  uploadedBy: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true, comment: 'Job start timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true, comment: 'Job completion timestamp' })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
