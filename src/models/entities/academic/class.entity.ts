import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'classes', schema: 'e_schooling' })
export class Class {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'Class name' })
  name: string;

  @Column({ name: 'class_code', type: 'varchar', nullable: true, comment: 'Class code (unique identifier)' })
  classCode: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Optional description of the class' })
  description: string;

  @Column({ name: 'daily_attendance_limit', type: 'integer', nullable: false, default: 1, comment: 'Max attendance sessions per day' })
  dailyAttendanceLimit: number;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  updatedById: string;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
