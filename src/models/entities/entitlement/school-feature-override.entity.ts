import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OverrideTypeEnum, FeatureBillingCycleEnum } from '../../enums/enums';

@Entity({ name: 'school_feature_overrides', schema: 'e_schooling' })
export class SchoolFeatureOverride {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: false,
    comment: 'Target School branch context',
  })
  schoolId: string;

  @Index()
  @Column({
    name: 'platform_feature_id',
    type: 'bigint',
    nullable: false,
    comment: 'Target PlatformFeature reference',
  })
  platformFeatureId: string;

  @Column({
    name: 'override_type',
    type: 'varchar',
    nullable: false,
    comment: 'ENABLE | DISABLE | CUSTOM_PRICE | CUSTOM_LIMIT | FREE_ACCESS',
  })
  overrideType: OverrideTypeEnum;

  @Column({
    name: 'is_enabled',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Feature toggle override state',
  })
  isEnabled: boolean;

  @Column({
    name: 'custom_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Custom enterprise price mapping',
  })
  customPrice: number | null;

  @Column({
    name: 'billing_cycle',
    type: 'varchar',
    nullable: true,
    comment: 'MONTHLY | YEARLY | ONE_TIME',
  })
  billingCycle: FeatureBillingCycleEnum | null;

  @Column({
    name: 'limit_value',
    type: 'bigint',
    nullable: true,
    comment: 'Tenant custom cap overriding global plan',
  })
  limitValue: string | null;

  @Column({
    name: 'start_date',
    type: 'timestamp',
    nullable: true,
    comment: 'Custom access boundary activation',
  })
  startDate: Date | null;

  @Column({
    name: 'end_date',
    type: 'timestamp',
    nullable: true,
    comment: 'Custom access expiration. Null signifies endless',
  })
  endDate: Date | null;

  @Column({
    name: 'remarks',
    type: 'text',
    nullable: true,
    comment: 'Administrative approval context notes',
  })
  remarks: string;

  @Index()
  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true,
    comment: 'Platform user ID who enacted override',
  })
  createdBy: string;

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
}
