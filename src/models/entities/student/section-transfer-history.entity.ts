import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'section_transfer_histories', schema: 'e_schooling' })
export class SectionTransferHistory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Index()
  @Column({ name: 'student_enrollment_id', type: 'bigint', nullable: true, comment: 'Reference to StudentEnrollment' })
  studentEnrollmentId: string;

  @Index()
  @Column({ name: 'old_section_id', type: 'bigint', nullable: true, comment: 'Reference to old Section' })
  oldSectionId: string;

  @Index()
  @Column({ name: 'new_section_id', type: 'bigint', nullable: true, comment: 'Reference to new Section' })
  newSectionId: string;

  @Column({ name: 'reason', type: 'text', nullable: true, comment: 'Transfer reason' })
  reason: string;

  @Index()
  @Column({ name: 'changed_by', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  changedBy: string;

  @Column({ name: 'changed_at', type: 'timestamp', nullable: true, comment: 'Change timestamp' })
  changedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;
}
