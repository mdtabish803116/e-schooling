import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'feature_usage_logs', schema: 'e_schooling' })
export class FeatureUsageLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Target school context consuming resource' })
  schoolId: string;

  @Index()
  @Column({ name: 'feature_id', type: 'bigint', nullable: false, comment: 'Target metered platform feature ID' })
  featureId: string;

  @Column({ name: 'usage_count', type: 'bigint', nullable: false, default: 1, comment: 'Units consumed in event tracking payload' })
  usageCount: string;

  @Column({ name: 'usage_date', type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP', comment: 'Timestamp of consumption' })
  usageDate: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true, comment: 'Event telemetry tracking details' })
  metadata: Record<string, any>;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation log insertion timestamp' })
  createdAt: Date;
}
