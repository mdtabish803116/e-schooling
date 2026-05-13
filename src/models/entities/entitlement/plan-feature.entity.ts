import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'plan_features', schema: 'e_schooling' })
export class PlanFeature {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'plan_id', type: 'bigint', nullable: false, comment: 'Reference to SubscriptionPlan' })
  planId: string;

  @Index()
  @Column({ name: 'feature_id', type: 'bigint', nullable: false, comment: 'Reference to PlatformFeature' })
  featureId: string;

  @Column({ name: 'is_enabled', type: 'boolean', nullable: false, default: true, comment: 'Baseline feature enabled state' })
  isEnabled: boolean;

  @Column({ name: 'limit_value', type: 'bigint', nullable: true, comment: 'Default quota limit. Null means unlimited' })
  limitValue: string | null;

  @Column({ name: 'extra_metadata', type: 'jsonb', nullable: true, comment: 'Extensible plan configuration details' })
  extraMetadata: Record<string, any>;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
