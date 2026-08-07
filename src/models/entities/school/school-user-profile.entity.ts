import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { SchoolUser } from './school-user.entity';

@Entity({ name: 'school_user_profiles', schema: 'e_schooling' })
export class SchoolUserProfile {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
    comment: 'Primary key',
  })
  id: string;

  @Index({ unique: true })
  @Column({
    name: 'school_user_id',
    type: 'bigint',
    nullable: false,
    comment: 'Reference to SchoolUser',
  })
  schoolUserId: string;

  @OneToOne(() => SchoolUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_user_id' })
  user: SchoolUser;

  @Column({
    name: 'father_name',
    type: 'varchar',
    nullable: true,
    comment: 'Father name',
  })
  fatherName: string;

  @Column({
    name: 'mother_name',
    type: 'varchar',
    nullable: true,
    comment: 'Mother name',
  })
  motherName: string;

  @Column({
    name: 'profile_pic_url',
    type: 'varchar',
    nullable: true,
    comment: 'Profile picture URL',
  })
  profilePicUrl: string;

  @Column({
    name: 'dob',
    type: 'date',
    nullable: true,
    comment: 'Date of birth',
  })
  dob: string;

  @Column({
    name: 'aadhaar_number',
    type: 'varchar',
    nullable: true,
    comment: 'Aadhaar number',
  })
  aadhaarNumber: string;

  @Column({
    name: 'years_of_experience',
    type: 'int',
    nullable: true,
    comment: 'Total years of experience',
  })
  yearsOfExperience: number;

  @Column({
    name: 'previous_organization',
    type: 'varchar',
    nullable: true,
    comment: 'Last organization served',
  })
  previousOrganization: string;

  @Column({
    name: 'expertise',
    type: 'text',
    nullable: true,
    comment: 'Area of expertise',
  })
  expertise: string;

  @Column({
    name: 'subjects',
    type: 'text',
    nullable: true,
    comment: 'Subjects handled (comma separated)',
  })
  subjects: string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    nullable: true,
    comment: 'First name',
  })
  firstName: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
    nullable: true,
    comment: 'Last name',
  })
  lastName: string;

  @Column({
    name: 'email',
    type: 'varchar',
    nullable: true,
    comment: 'Primary contact email',
  })
  email: string;

  @Column({
    name: 'designation',
    type: 'varchar',
    nullable: true,
    comment: 'Job designation',
  })
  designation: string;

  @Column({
    name: 'joining_date',
    type: 'date',
    nullable: true,
    comment: 'Date of joining the school',
  })
  joiningDate: string;

  @Column({
    name: 'department_name',
    type: 'varchar',
    nullable: true,
    comment: 'Department name',
  })
  departmentName: string;

  @Column({
    name: 'qualifications',
    type: 'jsonb',
    nullable: true,
    default: '[]',
    comment: 'Academic qualifications history',
  })
  qualifications: any;

  @Column({
    name: 'experience',
    type: 'jsonb',
    nullable: true,
    default: '[]',
    comment: 'Professional experience history',
  })
  experience: any;

  @Column({
    name: 'documents',
    type: 'jsonb',
    nullable: true,
    default: '[]',
    comment: 'Uploaded staff verification documents',
  })
  documents: any;

  @Column({
    name: 'assigned_classes',
    type: 'jsonb',
    nullable: true,
    default: '[]',
    comment: 'Assigned classes list',
  })
  assignedClasses: any;

  @Column({
    name: 'assigned_subjects',
    type: 'jsonb',
    nullable: true,
    default: '[]',
    comment: 'Assigned subjects list',
  })
  assignedSubjects: any;

  @Column({
    name: 'timetable_assignments',
    type: 'jsonb',
    nullable: true,
    default: '[]',
    comment: 'Timetable slots and period allocations',
  })
  timetableAssignments: any;

  @Column({
    name: 'gender',
    type: 'varchar',
    nullable: true,
    comment: 'Male | Female | Other',
  })
  gender: string;

  @Column({
    name: 'emergency_contact',
    type: 'varchar',
    nullable: true,
    comment: 'Emergency contact number',
  })
  emergencyContact: string;

  @Column({
    name: 'address',
    type: 'text',
    nullable: true,
    comment: 'Residential address',
  })
  address: string;

  @Column({
    name: 'employment_status',
    type: 'varchar',
    nullable: true,
    comment: 'Full-time | Part-time | Contract',
  })
  employmentStatus: string;

  @Column({
    name: 'salary_type',
    type: 'varchar',
    nullable: true,
    comment: 'Monthly | Hourly',
  })
  salaryType: string;

  @Column({
    name: 'base_salary',
    type: 'numeric',
    nullable: true,
    comment: 'Base salary amount',
  })
  baseSalary: number;

  @Column({
    name: 'allowances',
    type: 'numeric',
    nullable: true,
    comment: 'Additional allowances',
  })
  allowances: number;

  @Column({
    name: 'bank_name',
    type: 'varchar',
    nullable: true,
    comment: 'Bank name for payroll',
  })
  bankName: string;

  @Column({
    name: 'account_number',
    type: 'varchar',
    nullable: true,
    comment: 'Bank account number',
  })
  accountNumber: string;

  @Column({
    name: 'ifsc_code',
    type: 'varchar',
    nullable: true,
    comment: 'Bank IFSC code',
  })
  ifscCode: string;

  @Column({
    name: 'pan_number',
    type: 'varchar',
    nullable: true,
    comment: 'PAN card number',
  })
  panNumber: string;

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
