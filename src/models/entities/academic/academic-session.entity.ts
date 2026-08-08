import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'academic_sessions', schema: 'e_schooling' })
export class AcademicSession {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to School',
  })
  schoolId: string;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: true,
    comment: 'Session name (e.g. 2025-2026)',
  })
  name: string;

  @Column({
    name: 'start_date',
    type: 'date',
    nullable: true,
    comment: 'Session start date',
  })
  startDate: string;

  @Column({
    name: 'end_date',
    type: 'date',
    nullable: true,
    comment: 'Session end date',
  })
  endDate: string;

  @Column({
    name: 'is_current',
    type: 'boolean',
    nullable: true,
    comment: 'Is this the current session',
  })
  isCurrent: boolean;

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

  @Index()
  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolUser',
  })
  createdById: string;

  @Index()
  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolUser',
  })
  updatedById: string;

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
