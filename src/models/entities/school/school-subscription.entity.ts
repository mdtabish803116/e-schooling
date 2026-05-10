import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BillingCycleEnum, SubscriptionStatusEnum } from '../../enums/enums';

@Entity({ name: 'school_subscriptions', schema: 'e_schooling' })
export class SchoolSubscription {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'subscription_plan_id', type: 'bigint', nullable: true, comment: 'Reference to SubscriptionPlan' })
  subscriptionPlanId: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true, comment: 'Subscription start date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true, comment: 'Subscription end date' })
  endDate: Date;

  @Column({ name: 'billing_cycle', type: 'varchar', nullable: true, comment: 'monthly | quarterly | yearly' })
  billingCycle: BillingCycleEnum;

  @Column({ name: 'amount_paid', type: 'decimal', nullable: true, comment: 'Amount paid' })
  amountPaid: number;

  @Column({ name: 'currency', type: 'varchar', nullable: true, comment: 'Currency of payment' })
  currency: string;

  @Column({ name: 'subscription_status', type: 'varchar', nullable: true, comment: 'trial | active | expired | cancelled | suspended' })
  subscriptionStatus: SubscriptionStatusEnum;

  @Column({ name: 'auto_renew', type: 'boolean', nullable: true, comment: 'Whether subscription renews automatically' })
  autoRenew: boolean;

  @Index()
  @Column({ name: 'activated_by', type: 'bigint', nullable: true, comment: 'Reference to SchoolOwner who activated' })
  activatedBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
