import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AttendanceStatusEnum } from '../../enums/enums';

@Entity({ name: 'attendance_records', schema: 'e_schooling' })
export class AttendanceRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'session_id', type: 'bigint', nullable: true, comment: 'Reference to AttendanceSession' })
  sessionId: string;

  @Index()
  @Column({ name: 'student_enrollment_id', type: 'bigint', nullable: true, comment: 'Reference to StudentEnrollment' })
  studentEnrollmentId: string;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'present | absent | leave | half_day' })
  status: AttendanceStatusEnum;

  @Column({ name: 'remarks', type: 'text', nullable: true, comment: 'Attendance remarks' })
  remarks: string;

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to Creator' })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to Updater' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
