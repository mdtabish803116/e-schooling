import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StudentAdmissionDto {
  /* ── Required ── */
  @ApiProperty({ example: 'Amit' })
  @IsString() @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Kumar', required: false })
  @IsString() @IsOptional()
  lastName: string;

  @ApiProperty({ example: 'MALE' })
  @IsString() @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '2010-05-15' })
  @IsDateString() @IsNotEmpty()
  dob: string;

  @ApiProperty({ example: '1', description: 'Class ID' })
  @IsString() @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: '1', description: 'Section ID' })
  @IsString() @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: '1', description: 'Academic Session ID' })
  @IsString() @IsNotEmpty()
  academicSessionId: string;

  @ApiProperty({ example: '10', description: 'Role ID' })
  @IsString() @IsNotEmpty()
  roleId: string;

  /* ── Admission / Enrollment ── */
  @ApiProperty({ example: 'ADM-2024-001', required: false })
  @IsString() @IsOptional()
  admissionNumber: string;

  @ApiProperty({ example: '7', required: false })
  @IsString() @IsOptional()
  rollNumber?: string;

  @ApiProperty({ example: '2024-06-01', required: false })
  @IsOptional()
  admissionDate?: string;

  @ApiProperty({ example: '2024-06-10', required: false })
  @IsOptional()
  joiningDate?: string;

  @ApiProperty({ example: 'NEW', description: 'NEW | TRANSFER', required: false })
  @IsString() @IsOptional()
  admissionType?: string;

  /* ── Personal ── */
  @ApiProperty({ example: 'O+', required: false })
  @IsString() @IsOptional()
  bloodGroup?: string;

  @ApiProperty({ example: 'Hindu', required: false })
  @IsString() @IsOptional()
  religion?: string;

  @ApiProperty({ example: 'General', required: false })
  @IsString() @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Indian', required: false })
  @IsString() @IsOptional()
  nationality?: string;

  @ApiProperty({ example: '123456789012', required: false })
  @IsString() @IsOptional()
  aadhaarNumber?: string;

  /* ── Contact ── */
  @ApiProperty({ example: '+919876543210', required: false })
  @IsString() @IsOptional()
  phone?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsString() @IsOptional()
  mobile?: string;

  @ApiProperty({ example: '9898989898', required: false })
  @IsString() @IsOptional()
  alternateMobile?: string;

  @ApiProperty({ example: 'amit@gmail.com', required: false })
  @IsString() @IsOptional()
  email?: string;

  /* ── Address ── */
  @ApiProperty({ example: '123 MG Road', required: false })
  @IsString() @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Rampur Village', required: false })
  @IsString() @IsOptional()
  village?: string;

  @ApiProperty({ example: 'Lucknow', required: false })
  @IsString() @IsOptional()
  district?: string;

  @ApiProperty({ example: 'Uttar Pradesh', required: false })
  @IsString() @IsOptional()
  state?: string;

  @ApiProperty({ example: '226001', required: false })
  @IsString() @IsOptional()
  pincode?: string;

  /* ── Parent (legacy generic) ── */
  @ApiProperty({ example: 'Sanjay Kumar', required: false })
  @IsString() @IsOptional()
  parentName?: string;

  @ApiProperty({ example: '9988776655', required: false })
  @IsString() @IsOptional()
  parentPhone?: string;

  /* ── Father ── */
  @ApiProperty({ example: 'Ramesh Kumar', required: false })
  @IsString() @IsOptional()
  fatherName?: string;

  @ApiProperty({ example: 'Engineer', required: false })
  @IsString() @IsOptional()
  fatherOccupation?: string;

  @ApiProperty({ example: '9876501234', required: false })
  @IsString() @IsOptional()
  fatherMobile?: string;

  @ApiProperty({ example: 'ramesh@gmail.com', required: false })
  @IsString() @IsOptional()
  fatherEmail?: string;

  @ApiProperty({ example: '123412341234', required: false })
  @IsString() @IsOptional()
  fatherAadhaar?: string;

  /* ── Mother ── */
  @ApiProperty({ example: 'Sunita Kumar', required: false })
  @IsString() @IsOptional()
  motherName?: string;

  @ApiProperty({ example: 'Teacher', required: false })
  @IsString() @IsOptional()
  motherOccupation?: string;

  @ApiProperty({ example: '9876505678', required: false })
  @IsString() @IsOptional()
  motherMobile?: string;

  @ApiProperty({ example: 'sunita@gmail.com', required: false })
  @IsString() @IsOptional()
  motherEmail?: string;

  @ApiProperty({ example: '432143214321', required: false })
  @IsString() @IsOptional()
  motherAadhaar?: string;

  /* ── Guardian ── */
  @ApiProperty({ example: 'Vikram Singh', required: false })
  @IsString() @IsOptional()
  guardianName?: string;

  @ApiProperty({ example: 'Uncle', required: false })
  @IsString() @IsOptional()
  guardianRelation?: string;

  @ApiProperty({ example: '9123456789', required: false })
  @IsString() @IsOptional()
  guardianMobile?: string;

  @ApiProperty({ example: 'vikram@gmail.com', required: false })
  @IsString() @IsOptional()
  guardianEmail?: string;

  /* ── Emergency ── */
  @ApiProperty({ example: 'Priya Sharma', required: false })
  @IsString() @IsOptional()
  emergencyContactName?: string;

  @ApiProperty({ example: '9000011111', required: false })
  @IsString() @IsOptional()
  emergencyContactPhone?: string;

  @ApiProperty({ example: 'Aunt', required: false })
  @IsString() @IsOptional()
  emergencyContactRelation?: string;

  /* ── Medical ── */
  @ApiProperty({ example: 'Mild Asthma', required: false })
  @IsString() @IsOptional()
  medicalCondition?: string;

  @ApiProperty({ example: 'Penicillin, Dust', required: false })
  @IsString() @IsOptional()
  allergies?: string;

  @ApiProperty({ example: 'None', required: false })
  @IsString() @IsOptional()
  disability?: string;

  @ApiProperty({ example: 'Dr. Anita Roy', required: false })
  @IsString() @IsOptional()
  doctorName?: string;

  @ApiProperty({ example: '9830011223', required: false })
  @IsString() @IsOptional()
  doctorPhone?: string;

  /* ── Previous School ── */
  @ApiProperty({ required: false })
  @IsObject() @IsOptional()
  previousSchool?: Record<string, any>;

  /* ── Photo ── */
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  profilePicUrl?: string;
}
