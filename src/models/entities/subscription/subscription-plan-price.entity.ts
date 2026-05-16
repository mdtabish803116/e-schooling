import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BillingCycleEnum } from '../../enums/enums';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity({ name: 'subscription_plan_prices', schema: 'e_schooling' })
@Index(['subscriptionPlanId', 'billingCycle'], { unique: true })
export class SubscriptionPlanPrice {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'subscription_plan_id', type: 'bigint', nullable: false, comment: 'Reference to SubscriptionPlan' })
  subscriptionPlanId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'billing_cycle', type: 'varchar', nullable: false, comment: 'monthly | quarterly | yearly' })
  billingCycle: BillingCycleEnum;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: false, comment: 'Price in INR' })
  price: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;
}
