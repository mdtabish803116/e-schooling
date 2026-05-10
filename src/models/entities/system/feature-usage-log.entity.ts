import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'feature_usage_logs', schema: 'e_schooling' })
export class FeatureUsageLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'feature_id', type: 'bigint', nullable: true, comment: 'Reference to Feature' })
  featureId: string;

  @Column({ name: 'usage_count', type: 'integer', nullable: true, comment: 'Usage count' })
  usageCount: number;

  @Column({ name: 'usage_date', type: 'date', nullable: true, comment: 'Usage date' })
  usageDate: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;
}
