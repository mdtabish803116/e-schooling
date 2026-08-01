import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from './class.entity';

@Entity({ name: 'sections', schema: 'e_schooling' })
export class Section {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint', nullable: true, comment: 'Reference to AcademicSession' })
  academicSessionId: string | null;

  @Index()
  @Column({ name: 'class_id', type: 'bigint', nullable: true, comment: 'Reference to Class' })
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'name', type: 'varchar', nullable: true, comment: 'Section name' })
  name: string;

  @Column({ name: 'capacity', type: 'integer', nullable: true, comment: 'Maximum student capacity in this section' })
  capacity: number;

  @Column({ name: 'room', type: 'varchar', nullable: true, comment: 'Assigned classroom' })
  room: string;

  @Column({ name: 'is_default', type: 'boolean', nullable: true, comment: 'Is default section' })
  isDefault: boolean;

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
