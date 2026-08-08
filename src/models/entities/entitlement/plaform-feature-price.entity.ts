import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformFeature } from './platform-feature.entity';

@Entity({ name: 'plaform_feature_prices', schema: 'e_schooling' })
@Index(['platformFeatureId', 'billingCycle'], { unique: true })
export class PlatformFeaturePrice {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'platform_feature_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to PlatformFeature',
  })
  platformFeatureId: string;

  @ManyToOne(() => PlatformFeature)
  @JoinColumn({ name: 'platform_feature_id' })
  platformFeature: PlatformFeature;

  @Column({
    name: 'billing_cycle',
    type: 'varchar',
    nullable: false,
    comment: 'monthly | yearly | per_unit',
  })
  billingCycle: string; // Using string to allow 'per_unit' or BillingCycleEnum

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: 'Price for the specific cycle',
  })
  price: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isActive: boolean;
}
