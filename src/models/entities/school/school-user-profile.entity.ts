import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { SchoolUser } from './school-user.entity';

@Entity({ name: 'school_user_profiles', schema: 'e_schooling' })
export class SchoolUserProfile {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', comment: 'Primary key' })
  id: string;

  @Index({ unique: true })
  @Column({ name: 'school_user_id', type: 'bigint', nullable: false, comment: 'Reference to SchoolUser' })
  schoolUserId: string;

  @OneToOne(() => SchoolUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_user_id' })
  user: SchoolUser;

  @Column({ name: 'father_name', type: 'varchar', nullable: true, comment: 'Father name' })
  fatherName: string;

  @Column({ name: 'mother_name', type: 'varchar', nullable: true, comment: 'Mother name' })
  motherName: string;

  @Column({ name: 'profile_pic_url', type: 'varchar', nullable: true, comment: 'Profile picture URL' })
  profilePicUrl: string;

  @Column({ name: 'dob', type: 'date', nullable: true, comment: 'Date of birth' })
  dob: string;

  @Column({ name: 'aadhaar_number', type: 'varchar', nullable: true, comment: 'Aadhaar number' })
  aadhaarNumber: string;

  @Column({ name: 'years_of_experience', type: 'int', nullable: true, comment: 'Total years of experience' })
  yearsOfExperience: number;

  @Column({ name: 'previous_organization', type: 'varchar', nullable: true, comment: 'Last organization served' })
  previousOrganization: string;

  @Column({ name: 'expertise', type: 'text', nullable: true, comment: 'Area of expertise' })
  expertise: string;

  @Column({ name: 'subjects', type: 'text', nullable: true, comment: 'Subjects handled (comma separated)' })
  subjects: string;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true, comment: 'Active status toggle' })
  isActive: boolean;

  @Column({ name: 'is_delete', type: 'boolean', nullable: false, default: false, comment: 'Soft delete marker' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Last update timestamp' })
  updatedAt: Date;
}
