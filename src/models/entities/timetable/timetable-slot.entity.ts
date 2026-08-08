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
import { Timetable } from './timetable.entity';
import { TimetablePeriod } from './timetable-period.entity';
import { Class } from '../academic/class.entity';
import { Section } from '../academic/section.entity';
import { Subject } from '../academic/subject.entity';
import { SchoolUser } from '../school/school-user.entity';

@Entity({ name: 'academic_timetable_slots', schema: 'e_schooling' })
export class TimetableSlot {
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
    name: 'timetable_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Timetable',
  })
  timetableId: string;

  @Column({
    name: 'day',
    type: 'varchar',
    nullable: false,
    comment: 'Day of week (Monday, Tuesday, etc.)',
  })
  day: string;

  @Index()
  @Column({
    name: 'period_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to TimetablePeriod',
  })
  periodId: string;

  @Index()
  @Column({
    name: 'class_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Class',
  })
  classId: string;

  @Index()
  @Column({
    name: 'section_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Section',
  })
  sectionId: string;

  @Index()
  @Column({
    name: 'subject_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to Subject',
  })
  subjectId: string;

  @Index()
  @Column({
    name: 'teacher_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to SchoolUser (Teacher)',
  })
  teacherId: string;

  @Column({
    name: 'room_no',
    type: 'varchar',
    nullable: true,
    comment: 'Classroom / Room number',
  })
  roomNo: string;

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

  @ManyToOne(() => Timetable, (t) => t.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'timetable_id' })
  timetable: Timetable;

  @ManyToOne(() => TimetablePeriod)
  @JoinColumn({ name: 'period_id' })
  period: TimetablePeriod;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => SchoolUser)
  @JoinColumn({ name: 'teacher_id' })
  teacher: SchoolUser;
}
