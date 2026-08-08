import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PlanCodeEnum } from '../../enums/enums';
import { SubscriptionPlanPrice } from './subscription-plan-price.entity';
import { SubscriptionPlanPlatformFeatureMapping } from '../entitlement/subscription-plan-platform-feature-mapping.entity';

@Entity({ name: 'subscription_plans', schema: 'e_schooling' })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index({ unique: true })
  @Column({
    name: 'code',
    type: 'varchar',
    nullable: false,
    comment: 'Unique plan code e.g. TRIAL, BASIC, STANDARD, PREMIUM',
  })
  code: PlanCodeEnum;

  @OneToMany(() => SubscriptionPlanPrice, (price) => price.subscriptionPlan)
  prices: SubscriptionPlanPrice[];

  @OneToMany(
    () => SubscriptionPlanPlatformFeatureMapping,
    (mapping) => mapping.subscriptionPlan,
  )
  featureMappings: SubscriptionPlanPlatformFeatureMapping[];

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: false,
    comment: 'Display name e.g. Basic Plan',
  })
  name: string;

  @Column({
    name: 'description',
    type: 'varchar',
    nullable: true,
    comment: 'Plan description',
  })
  description: string;

  @Column({
    name: 'max_students',
    type: 'int',
    nullable: true,
    comment: 'Maximum allowed students. Null means unlimited.',
  })
  maxStudents: number | null;

  @Column({
    name: 'max_staff',
    type: 'int',
    nullable: true,
    comment: 'Maximum allowed school staff/users. Null means unlimited.',
  })
  maxStaff: number | null;

  @Column({
    name: 'max_classes',
    type: 'int',
    nullable: true,
    comment: 'Maximum allowed classes. Null means unlimited.',
  })
  maxClasses: number | null;

  @Column({
    name: 'max_sections',
    type: 'int',
    nullable: true,
    comment: 'Maximum allowed sections. Null means unlimited.',
  })
  maxSections: number | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Last update timestamp',
  })
  updatedAt: Date;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Active status toggle',
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Soft delete marker',
  })
  isDeleted: boolean;
}
