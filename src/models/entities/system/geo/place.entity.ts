import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'places', schema: 'e_schooling' })
export class Place {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Target tenant branch customizing this place' })
  schoolId: string;

  @Index()
  @Column({ name: 'district_id', type: 'bigint', nullable: false, comment: 'Reference to parent District' })
  districtId: string;

  @Index()
  @Column({ name: 'name', type: 'varchar', nullable: false, comment: 'Village, City, or custom local cluster name' })
  name: string;

  @Column({ name: 'pincode', type: 'varchar', nullable: true, comment: 'Postal code' })
  pincode: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
