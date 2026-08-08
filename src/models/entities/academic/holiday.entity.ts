import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'holidays', schema: 'e_schooling' })
export class Holiday {
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
    name: 'title',
    type: 'varchar',
    nullable: false,
    comment: 'Holiday title',
  })
  title: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: 'Description or remarks',
  })
  description?: string | null;

  @Column({
    name: 'from_date',
    type: 'date',
    nullable: false,
    comment: 'Start date of holiday',
  })
  fromDate: string;

  @Column({
    name: 'to_date',
    type: 'date',
    nullable: false,
    comment: 'End date of holiday',
  })
  toDate: string;

  @Column({
    name: 'academic_session_id',
    type: 'bigint',
    nullable: true,
    comment: 'Academic session ID',
  })
  academicSessionId?: string | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isActive: boolean;

  @Column({
    name: 'is_delete',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isDeleted: boolean;

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
