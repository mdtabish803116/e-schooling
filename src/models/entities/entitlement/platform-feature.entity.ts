import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FeatureTypeEnum, UsageUnitEnum } from '../../enums/enums';

@Entity({ name: 'platform_features', schema: 'e_schooling' })
export class PlatformFeature {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Column({ name: 'name', type: 'varchar', nullable: false, comment: 'Display name e.g. WhatsApp Integration' })
  name: string;

  @Index({ unique: true })
  @Column({ name: 'code', type: 'varchar', nullable: false, comment: 'Unique identification code' })
  code: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Capability documentation' })
  description: string;

  // Database type is varchar for zero migration friction, while app-level remains strongly typed enum
  @Column({
    name: 'feature_type',
    type: 'varchar',
    nullable: false,
    default: FeatureTypeEnum.ADDON,
    comment: 'CORE | ADDON | ENTERPRISE',
  })
  featureType: FeatureTypeEnum;

  @Column({
    name: 'usage_unit',
    type: 'varchar',
    nullable: false,
    default: UsageUnitEnum.NONE,
    comment: 'NONE | STUDENTS | MESSAGES | ADMINS | STORAGE_GB | API_CALLS',
  })
  usageUnit: UsageUnitEnum;

  @Column({ name: 'is_metered', type: 'boolean', nullable: false, default: false, comment: 'True if metered consumption applies' })
  isMetered: boolean;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Global availability toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
