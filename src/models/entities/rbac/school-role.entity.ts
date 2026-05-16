import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'school_roles', schema: 'e_schooling' })
export class SchoolRole {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: false, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'name', type: 'varchar', nullable: false, comment: 'Role name e.g. Teacher, HOD' })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Role purpose' })
  description?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to Creator' })
  createdById?: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to Updater' })
  updatedById?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
