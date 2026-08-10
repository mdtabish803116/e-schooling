import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'admission_applications', schema: 'e_schooling' })
@Index(['schoolId'])
export class AdmissionApplication {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'school_id', type: 'varchar' })
  schoolId: string;

  @Column({ name: 'application_no', type: 'varchar' })
  applicationNo: string;

  @Column({ name: 'enquiry_id', type: 'varchar', nullable: true })
  enquiryId?: string;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName: string;

  @Column({ name: 'gender', type: 'varchar', default: 'MALE' })
  gender: string;

  @Column({ name: 'dob', type: 'varchar', nullable: true })
  dob?: string;

  @Column({ name: 'father_name', type: 'varchar' })
  fatherName: string;

  @Column({ name: 'father_phone', type: 'varchar' })
  fatherPhone: string;

  @Column({ name: 'mother_name', type: 'varchar', nullable: true })
  motherName?: string;

  @Column({ name: 'target_class_id', type: 'varchar' })
  targetClassId: string;

  @Column({ name: 'target_class_name', type: 'varchar', nullable: true })
  targetClassName?: string;

  @Column({ name: 'stage', type: 'varchar', default: 'APPLICATION' })
  stage: string;

  @Column({ name: 'verification_status', type: 'varchar', default: 'PENDING' })
  verificationStatus: string;

  @Column({ name: 'verified_documents', type: 'jsonb', nullable: true })
  verifiedDocuments?: string[];

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'approval_remarks', type: 'text', nullable: true })
  approvalRemarks?: string;

  @Column({ name: 'approved_by', type: 'varchar', nullable: true })
  approvedBy?: string;

  @Column({ name: 'converted_student_id', type: 'varchar', nullable: true })
  convertedStudentId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
