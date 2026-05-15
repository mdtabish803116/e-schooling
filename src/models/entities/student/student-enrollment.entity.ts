import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { EnrollmentStatusEnum, EnrollmentTypeEnum } from '../../enums/enums';

@Entity({ name: 'student_enrollments', schema: 'e_schooling' })
export class StudentEnrollment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'student_id', type: 'bigint', nullable: true, comment: 'Reference to Student' })
  studentId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint', nullable: true, comment: 'Reference to AcademicSession' })
  academicSessionId: string;

  @Index()
  @Column({ name: 'class_id', type: 'bigint', nullable: true, comment: 'Reference to Class' })
  classId: string;

  @Index()
  @Column({ name: 'section_id', type: 'bigint', nullable: true, comment: 'Reference to Section' })
  sectionId: string;

  @Column({ name: 'roll_number', type: 'varchar', nullable: true, comment: 'Roll number' })
  rollNumber: string;

  @Column({ name: 'enrollment_type', type: 'varchar', nullable: true, comment: 'admission | promotion | demotion | transfer | repeat | special_promotion' })
  enrollmentType: EnrollmentTypeEnum;

  @Column({ name: 'enrollment_state', type: 'varchar', nullable: true, comment: 'active | promoted | demoted | transferred | completed | dropped' })
  enrollmentState: EnrollmentStatusEnum;

  @Index()
  @Column({ name: 'previous_enrollment_id', type: 'bigint', nullable: true, comment: 'Reference to previous StudentEnrollment' })
  previousEnrollmentId: string;

  @Column({ name: 'is_current', type: 'boolean', default: false, comment: 'Whether this is the student\'s current active enrollment' })
  isCurrent: boolean;

  @Column({ name: 'start_date', type: 'date', nullable: true, comment: 'Enrollment start date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true, comment: 'Enrollment end date (set when student is promoted/transferred)' })
  endDate: string;

  @Column({ name: 'joined_at', type: 'timestamp', nullable: true, comment: 'Join timestamp' })
  joinedAt: Date;

  @Index()
  @Column({ name: 'promoted_by', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  promotedBy: string;

  @Column({ name: 'promoted_at', type: 'timestamp', nullable: true, comment: 'Promotion timestamp' })
  promotedAt: Date;

  @Column({ name: 'remarks', type: 'text', nullable: true, comment: 'Remarks' })
  remarks: string;

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to Creator' })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to Updater' })
  updatedById: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
