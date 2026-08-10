import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'admission_enquiries', schema: 'e_schooling' })
@Index(['schoolId'])
export class AdmissionEnquiry {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'school_id', type: 'varchar' })
  schoolId: string;

  @Column({ name: 'enquiry_no', type: 'varchar' })
  enquiryNo: string;

  @Column({ name: 'student_name', type: 'varchar' })
  studentName: string;

  @Column({ name: 'parent_name', type: 'varchar' })
  parentName: string;

  @Column({ name: 'contact_number', type: 'varchar' })
  contactNumber: string;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email?: string;

  @Column({ name: 'target_class_id', type: 'varchar' })
  targetClassId: string;

  @Column({ name: 'target_class_name', type: 'varchar', nullable: true })
  targetClassName?: string;

  @Column({ name: 'gender', type: 'varchar', default: 'MALE' })
  gender: string;

  @Column({ name: 'previous_school', type: 'varchar', nullable: true })
  previousSchool?: string;

  @Column({ name: 'source', type: 'varchar', default: 'WALK_IN' })
  source: string;

  @Column({ name: 'stage', type: 'varchar', default: 'ENQUIRY' })
  stage: string;

  @Column({ name: 'enquiry_status', type: 'varchar', default: 'NEW' })
  enquiryStatus: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'assigned_to_staff_name', type: 'varchar', nullable: true })
  assignedToStaffName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
