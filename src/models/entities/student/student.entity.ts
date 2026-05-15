import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'students', schema: 'e_schooling' })
export class Student {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @Column({ name: 'admission_number', type: 'varchar', nullable: true, comment: 'Admission number' })
  admissionNumber: string;

  @Index({ unique: true })
  @Column({ name: 'student_code', type: 'varchar', nullable: true, comment: 'Unique student identification code used for login' })
  studentCode: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true, comment: 'Hashed password' })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true, comment: 'First name' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: true, comment: 'Last name' })
  lastName: string;

  @Column({ name: 'gender', type: 'varchar', nullable: true, comment: 'Gender' })
  gender: string;

  @Column({ name: 'dob', type: 'date', nullable: true, comment: 'Date of birth' })
  dob: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true, comment: 'Phone number' })
  phone: string;

  @Column({ name: 'email', type: 'varchar', nullable: true, comment: 'Email' })
  email: string;

  @Column({ name: 'parent_name', type: 'varchar', nullable: true, comment: 'Parent name' })
  parentName: string;

  @Column({ name: 'parent_phone', type: 'varchar', nullable: true, comment: 'Parent phone' })
  parentPhone: string;

  @Column({ name: 'address', type: 'text', nullable: true, comment: 'Physical address' })
  address: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @Index()
  @Column({ name: 'created_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  createdById: string;

  @Index()
  @Column({ name: 'updated_by_id', type: 'bigint', nullable: true, comment: 'Reference to SchoolUser' })
  updatedById: string;

  @Column({ name: 'state_id', type: 'bigint', nullable: true, comment: 'Reference to parent State' })
  stateId: string;

  @Column({ name: 'district_id', type: 'bigint', nullable: true, comment: 'Reference to parent District' })
  districtId: string;

  @Column({ name: 'place_id', type: 'bigint', nullable: true, comment: 'Reference to custom local Place/Village cluster' })
  placeId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
