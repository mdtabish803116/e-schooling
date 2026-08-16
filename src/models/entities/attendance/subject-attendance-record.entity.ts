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
import { AttendanceStatusEnum } from '../../enums/enums';
import { SubjectAttendanceSession } from './subject-attendance-session.entity';
import { StudentEnrollment } from '../student/student-enrollment.entity';
import { Student } from '../student/student.entity';

@Entity({ name: 'subject_attendance_records', schema: 'e_schooling' })
export class SubjectAttendanceRecord {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index()
  @Column({
    name: 'session_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to SubjectAttendanceSession',
  })
  sessionId: string;

  @ManyToOne(() => SubjectAttendanceSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SubjectAttendanceSession;

  @Index()
  @Column({
    name: 'student_enrollment_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to StudentEnrollment',
  })
  studentEnrollmentId: string | null;

  @ManyToOne(() => StudentEnrollment, { nullable: true })
  @JoinColumn({ name: 'student_enrollment_id' })
  studentEnrollment: StudentEnrollment;

  @Index()
  @Column({
    name: 'student_id',
    type: 'bigint',
    nullable: true,
    comment: 'Reference to Student directly',
  })
  studentId: string | null;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({
    name: 'attendance_mark',
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'present',
    comment: 'present | absent | late | half_day | leave',
  })
  attendanceMark: AttendanceStatusEnum;

  @Column({
    name: 'remarks',
    type: 'text',
    nullable: true,
    comment: 'Attendance remarks for subject session',
  })
  remarks: string | null;

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
