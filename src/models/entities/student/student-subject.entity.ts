import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { StatusEnum } from '../../enums/enums';

@Entity({ name: 'student_subjects', schema: 'e_schooling' })
export class StudentSubject {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'student_enrollment_id', type: 'bigint', nullable: true, comment: 'Reference to StudentEnrollment' })
  studentEnrollmentId: string;

  @Index()
  @Column({ name: 'subject_id', type: 'bigint', nullable: true, comment: 'Reference to Subject' })
  subjectId: string;

  @Column({ name: 'status', type: 'varchar', nullable: true, comment: 'active | dropped' })
  status: StatusEnum;

  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to Creator' })
  createdById: string;

  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to Updater' })
  updatedById: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
