import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AddonTypeEnum } from '../../enums/enums';

@Entity({ name: 'school_addons', schema: 'e_schooling' })
export class SchoolAddon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'addon_type', type: 'varchar', nullable: false, comment: 'Type of capacity booster pack e.g. STUDENT_BOOSTER_50' })
  addonType: AddonTypeEnum;

  @Column({ name: 'quota', type: 'int', nullable: false, comment: 'Capacity increase granted e.g. 50' })
  quota: number;

  @Column({ name: 'price_paid', type: 'decimal', precision: 10, scale: 2, nullable: false, comment: 'Amount paid for this booster block' })
  pricePaid: number;

  @Column({ name: 'addon_state', type: 'varchar', nullable: false, default: 'active', comment: 'active | expired' })
  addonState: string;

  @Column({ name: 'start_at', type: 'timestamp', nullable: false, comment: 'Booster start validity timestamp' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamp', nullable: false, comment: 'Booster expiration validity timestamp (+1 month)' })
  endAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;
}
