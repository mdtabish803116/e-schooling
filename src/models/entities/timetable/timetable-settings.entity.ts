import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'academic_timetable_settings', schema: 'e_schooling' })
export class TimetableSettings {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'school_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to School',
  })
  schoolId: string;

  @Index()
  @Column({
    name: 'academic_session_id',
    type: 'varchar',
    nullable: true,
    comment: 'Academic session/year reference',
  })
  academicSessionId: string | null;

  @Column({
    name: 'max_periods_per_day',
    type: 'integer',
    nullable: false,
    default: 8,
    comment: 'Max periods allowed per academic day',
  })
  maxPeriodsPerDay: number;

  @Column({
    name: 'period_duration_minutes',
    type: 'integer',
    nullable: false,
    default: 45,
    comment: 'Standard teaching period duration in minutes',
  })
  periodDurationMinutes: number;

  @Column({
    name: 'break_duration_minutes',
    type: 'integer',
    nullable: false,
    default: 15,
    comment: 'Standard interval break duration in minutes',
  })
  breakDurationMinutes: number;

  @Column({
    name: 'working_days',
    type: 'jsonb',
    nullable: false,
    default: () =>
      '\'["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]\'',
    comment: 'Active academic weekdays',
  })
  workingDays: string[];

  @Column({
    name: 'start_time',
    type: 'varchar',
    nullable: false,
    default: '08:00 AM',
    comment: 'Default daily start time',
  })
  startTime: string;

  @Column({
    name: 'end_time',
    type: 'varchar',
    nullable: false,
    default: '03:30 PM',
    comment: 'Default daily end time',
  })
  endTime: string;

  @Column({
    name: 'allow_teacher_collisions',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Permit teacher double-booking',
  })
  allowTeacherCollisions: boolean;

  @Column({
    name: 'allow_room_collisions',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Permit room double-booking',
  })
  allowRoomCollisions: boolean;

  @Column({
    name: 'auto_substitution_alerts',
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'Enable automated substitution notifications',
  })
  autoSubstitutionAlerts: boolean;

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
    comment: 'Reference to Creator',
  })
  createdById: string;

  @Index()
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
