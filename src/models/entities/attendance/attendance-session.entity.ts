import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'attendance_sessions', schema: 'e_schooling' })
export class AttendanceSession {
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

  @Index()
  @Column({
    name: 'academic_session_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to AcademicSession',
  })
  academicSessionId: string;

  @Index()
  @Column({
    name: 'class_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Class',
  })
  classId: string;

  @Index()
  @Column({
    name: 'section_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Section',
  })
  sectionId: string;

  @Column({
    name: 'date',
    type: 'date',
    nullable: true,
    comment: 'Attendance date',
  })
  date: string;

  @Column({
    name: 'session_slot',
    type: 'integer',
    nullable: false,
    default: 1,
    comment: 'Attendance session slot/slot number',
  })
  sessionSlot: number;

  @Index()
  @Column({
    name: 'taken_by',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolUser',
  })
  takenBy: string;

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

  @Column({
    name: 'created_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Creator',
  })
  createdById: string;

  @Column({
    name: 'updated_by_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Updater',
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
