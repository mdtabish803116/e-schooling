import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from '../school/school.entity';

@Entity({ name: 'students', schema: 'e_schooling' })
export class Student {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint', nullable: true, comment: 'Reference to School' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'admission_number', type: 'varchar', nullable: true, comment: 'Admission number' })
  admissionNumber: string;

  @Index({ unique: true })
  @Column({ name: 'student_code', type: 'varchar', nullable: true, comment: 'Unique student identification code used for login' })
  studentCode: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true, comment: 'Hashed password' })
  passwordHash: string;

  /* ── Personal Information ── */
  @Column({ name: 'first_name', type: 'varchar', nullable: true, comment: 'First name' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: true, comment: 'Last name' })
  lastName: string;

  @Column({ name: 'gender', type: 'varchar', nullable: true, comment: 'Gender' })
  gender: string;

  @Column({ name: 'dob', type: 'date', nullable: true, comment: 'Date of birth' })
  dob: string;

  @Column({ name: 'blood_group', type: 'varchar', nullable: true, comment: 'Blood group e.g. A+, O-' })
  bloodGroup: string;

  @Column({ name: 'religion', type: 'varchar', nullable: true, comment: 'Religion' })
  religion: string;

  @Column({ name: 'category', type: 'varchar', nullable: true, comment: 'Caste category e.g. General, OBC, SC, ST' })
  category: string;

  @Column({ name: 'nationality', type: 'varchar', nullable: true, default: 'Indian', comment: 'Nationality' })
  nationality: string;

  @Column({ name: 'aadhaar_number', type: 'varchar', nullable: true, comment: '12-digit Aadhaar number' })
  aadhaarNumber: string;

  /* ── Contact ── */
  @Column({ name: 'phone', type: 'varchar', nullable: true, comment: 'Primary phone number (legacy field)' })
  phone: string;

  @Column({ name: 'mobile', type: 'varchar', nullable: true, comment: 'Mobile / WhatsApp number' })
  mobile: string;

  @Column({ name: 'alternate_mobile', type: 'varchar', nullable: true, comment: 'Alternate contact number' })
  alternateMobile: string;

  @Column({ name: 'email', type: 'varchar', nullable: true, comment: 'Email' })
  email: string;

  /* ── Address ── */
  @Column({ name: 'address', type: 'text', nullable: true, comment: 'Full residential address' })
  address: string;

  @Column({ name: 'village', type: 'varchar', nullable: true, comment: 'Village / Locality' })
  village: string;

  @Column({ name: 'district', type: 'varchar', nullable: true, comment: 'District name' })
  district: string;

  @Column({ name: 'state', type: 'varchar', nullable: true, comment: 'State name' })
  state: string;

  @Column({ name: 'pincode', type: 'varchar', nullable: true, comment: 'Postal / ZIP code' })
  pincode: string;

  /* ── Parent / Guardian ── */
  @Column({ name: 'parent_name', type: 'varchar', nullable: true, comment: 'Generic parent name (legacy)' })
  parentName: string;

  @Column({ name: 'parent_phone', type: 'varchar', nullable: true, comment: 'Generic parent phone (legacy)' })
  parentPhone: string;

  @Column({ name: 'father_name', type: 'varchar', nullable: true, comment: "Father's full name" })
  fatherName: string;

  @Column({ name: 'father_occupation', type: 'varchar', nullable: true, comment: "Father's occupation" })
  fatherOccupation: string;

  @Column({ name: 'father_mobile', type: 'varchar', nullable: true, comment: "Father's mobile number" })
  fatherMobile: string;

  @Column({ name: 'father_email', type: 'varchar', nullable: true, comment: "Father's email" })
  fatherEmail: string;

  @Column({ name: 'father_aadhaar', type: 'varchar', nullable: true, comment: "Father's Aadhaar number" })
  fatherAadhaar: string;

  @Column({ name: 'mother_name', type: 'varchar', nullable: true, comment: "Mother's full name" })
  motherName: string;

  @Column({ name: 'mother_occupation', type: 'varchar', nullable: true, comment: "Mother's occupation" })
  motherOccupation: string;

  @Column({ name: 'mother_mobile', type: 'varchar', nullable: true, comment: "Mother's mobile number" })
  motherMobile: string;

  @Column({ name: 'mother_email', type: 'varchar', nullable: true, comment: "Mother's email" })
  motherEmail: string;

  @Column({ name: 'mother_aadhaar', type: 'varchar', nullable: true, comment: "Mother's Aadhaar number" })
  motherAadhaar: string;

  @Column({ name: 'guardian_name', type: 'varchar', nullable: true, comment: "Legal guardian's name" })
  guardianName: string;

  @Column({ name: 'guardian_relation', type: 'varchar', nullable: true, comment: "Guardian's relationship to student" })
  guardianRelation: string;

  @Column({ name: 'guardian_mobile', type: 'varchar', nullable: true, comment: "Guardian's mobile number" })
  guardianMobile: string;

  @Column({ name: 'guardian_email', type: 'varchar', nullable: true, comment: "Guardian's email" })
  guardianEmail: string;

  /* ── Emergency Contact ── */
  @Column({ name: 'emergency_contact_name', type: 'varchar', nullable: true, comment: 'Emergency contact person name' })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', nullable: true, comment: 'Emergency contact phone number' })
  emergencyContactPhone: string;

  @Column({ name: 'emergency_contact_relation', type: 'varchar', nullable: true, comment: 'Relation of emergency contact to student' })
  emergencyContactRelation: string;

  /* ── Medical ── */
  @Column({ name: 'medical_condition', type: 'text', nullable: true, comment: 'Known medical conditions' })
  medicalCondition: string;

  @Column({ name: 'allergies', type: 'text', nullable: true, comment: 'Known allergies' })
  allergies: string;

  @Column({ name: 'disability', type: 'varchar', nullable: true, comment: 'Physical/learning disability if any' })
  disability: string;

  @Column({ name: 'doctor_name', type: 'varchar', nullable: true, comment: 'Family doctor name' })
  doctorName: string;

  @Column({ name: 'doctor_phone', type: 'varchar', nullable: true, comment: 'Family doctor contact number' })
  doctorPhone: string;

  /* ── Admission ── */
  @Column({ name: 'admission_date', type: 'date', nullable: true, comment: 'Date of admission' })
  admissionDate: string;

  @Column({ name: 'joining_date', type: 'date', nullable: true, comment: 'Date of first joining' })
  joiningDate: string;

  @Column({ name: 'admission_type', type: 'varchar', nullable: true, comment: 'NEW or TRANSFER' })
  admissionType: string;

  /* ── Previous School (stored as JSONB) ── */
  @Column({ name: 'previous_school', type: 'jsonb', nullable: true, comment: 'Previous school details as JSON' })
  previousSchool: Record<string, any> | null;

  /* ── Photo & Documents ── */
  @Column({ name: 'profile_pic_url', type: 'varchar', nullable: true, comment: 'URL of the student profile picture' })
  profilePicUrl: string;

  @Column({ name: 'documents', type: 'jsonb', nullable: true, default: '[]', comment: 'Uploaded student verification documents' })
  documents: any;

  /* ── Status ── */
  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  /* ── Audit ── */
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

  @Column({ name: 'current_session_token', type: 'varchar', nullable: true, comment: 'Active session token' })
  currentSessionToken: string;

  @Column({ name: 'is_logged_in', type: 'boolean', default: false, comment: 'Active login flag' })
  isLoggedIn: boolean;

  @Column({ name: 'failed_login_attempts', type: 'integer', default: 0, comment: 'Failed login count' })
  failedLoginAttempts: number;

  @Column({ name: 'lockout_until', type: 'timestamp', nullable: true, comment: 'Lockout timestamp' })
  lockoutUntil: Date;

  @Column({ name: 'is_locked', type: 'boolean', default: false, comment: 'Account lock status' })
  isLocked: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
