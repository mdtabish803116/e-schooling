import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BillingCycleEnum, StatusEnum } from '../../enums/enums';

@Entity({ name: 'subscription_plans', schema: 'e_schooling' })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'Plan name' })
  name: string;

  @Index({ unique: true })
  @Column({ name: 'code', type: 'varchar', nullable: true, comment: 'Unique plan code' })
  code: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Plan description' })
  description: string;

  @Column({ name: 'billing_cycle', type: 'varchar', nullable: true, comment: 'monthly | quarterly | yearly' })
  billingCycle: BillingCycleEnum;

  @Column({ name: 'price', type: 'decimal', nullable: true, comment: 'Plan price' })
  price: number;

  @Column({ name: 'currency', type: 'varchar', nullable: true, comment: 'Currency for price' })
  currency: string;

  @Column({ name: 'is_free', type: 'boolean', nullable: true, comment: 'Whether the plan is free' })
  isFree: boolean;

  @Column({ name: 'trial_days', type: 'integer', nullable: true, comment: 'Number of trial days' })
  trialDays: number;

  @Column({ name: 'max_students', type: 'integer', nullable: true, comment: 'Maximum allowed students' })
  maxStudents: number;

  @Column({ name: 'max_teachers', type: 'integer', nullable: true, comment: 'Maximum allowed teachers' })
  maxTeachers: number;

  @Column({ name: 'max_admins', type: 'integer', nullable: true, comment: 'Maximum allowed admins' })
  maxAdmins: number;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | inactive' })
  status: StatusEnum;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
