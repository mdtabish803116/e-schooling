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
import { Class } from '../academic/class.entity';
import { Section } from '../academic/section.entity';
import { Subject } from '../academic/subject.entity';
import { SchoolUser } from '../school/school-user.entity';
import { TimetableSlot } from '../timetable/timetable-slot.entity';

@Entity({ name: 'subject_attendance_sessions', schema: 'e_schooling' })
export class SubjectAttendanceSession {
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
    type: 'bigint',
    nullable: true,
    comment: 'Reference to AcademicSession',
  })
  academicSessionId: string | null;

  @Index()
  @Column({
    name: 'class_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Class',
  })
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Index()
  @Column({
    name: 'section_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Section',
  })
  sectionId: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Index()
  @Column({
    name: 'subject_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Subject',
  })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Index()
  @Column({
    name: 'teacher_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to SchoolUser (Teacher taking session)',
  })
  teacherId: string | null;

  @ManyToOne(() => SchoolUser)
  @JoinColumn({ name: 'teacher_id' })
  teacher: SchoolUser;

  @Index()
  @Column({
    name: 'timetable_slot_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to TimetableSlot if timetable-scheduled',
  })
  timetableSlotId: string | null;

  @ManyToOne(() => TimetableSlot, { nullable: true })
  @JoinColumn({ name: 'timetable_slot_id' })
  timetableSlot: TimetableSlot;

  @Index()
  @Column({
    name: 'date',
    type: 'date',
    nullable: false,
    comment: 'Attendance date',
  })
  date: string;

  @Column({
    name: 'period_number',
    type: 'integer',
    nullable: false,
    default: 1,
    comment: 'Period number or subject session sequence',
  })
  periodNumber: number;

  @Column({
    name: 'session_title',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Optional session title or lesson topic',
  })
  sessionTitle: string | null;

  @Column({
    name: 'is_locked',
    type: 'boolean',
    nullable: false,
    default: false,
    comment: 'Lock status for editing',
  })
  isLocked: boolean;

  @Column({
    name: 'locked_by',
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'User who locked the session',
  })
  lockedBy: string | null;

  @Column({
    name: 'locked_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Timestamp when locked',
  })
  lockedAt: Date | null;

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
