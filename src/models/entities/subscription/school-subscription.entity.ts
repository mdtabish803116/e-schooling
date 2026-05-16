import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { SubscriptionStatusEnum, BillingCycleEnum } from '../../enums/enums';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity({ name: 'school_subscriptions', schema: 'e_schooling' })
export class SchoolSubscription {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index({ unique: true })
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'subscription_plan_id', type: 'bigint', nullable: false, comment: 'Reference to SubscriptionPlan' })
  subscriptionPlanId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'subscription_state', type: 'varchar', nullable: false, default: SubscriptionStatusEnum.TRIAL, comment: 'trial | active | expired | cancelled | suspended' })
  subscriptionState: SubscriptionStatusEnum;

  @Column({ name: 'billing_cycle', type: 'varchar', nullable: true, comment: 'Active billing cycle tier' })
  billingCycle: BillingCycleEnum;

  @Column({ name: 'trial_start_at', type: 'timestamp', nullable: true, comment: 'Trial start timestamp' })
  trialStartAt: Date;

  @Column({ name: 'trial_end_at', type: 'timestamp', nullable: true, comment: 'Trial expiration timestamp' })
  trialEndAt: Date;

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true, comment: 'Current billing period start' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true, comment: 'Current billing period expiration' })
  currentPeriodEnd: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;
}
