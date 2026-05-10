import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'subscription_plan_features', schema: 'e_schooling' })
export class SubscriptionPlanFeature {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'subscription_plan_id', type: 'bigint', nullable: true, comment: 'Reference to SubscriptionPlan' })
  subscriptionPlanId: string;

  @Index()
  @Column({ name: 'feature_id', type: 'bigint', nullable: true, comment: 'Reference to Feature' })
  featureId: string;

  @Column({ name: 'feature_limit', type: 'integer', nullable: true, comment: 'Limit for the feature' })
  featureLimit: number;

  @Column({ name: 'is_enabled', type: 'boolean', nullable: true, comment: 'Whether feature is enabled' })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;
}
