import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class StudentAdmissionDto {
  /* ── Required ── */
  @ApiProperty({ example: 'Amit' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Matches(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, {
    message: 'First name can only contain letters, hyphens, and apostrophes',
  })
  firstName: string;

  @ApiProperty({ example: 'Kumar', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Middle name cannot exceed 50 characters' })
  @Matches(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, {
    message: 'Middle name can only contain letters, hyphens, and apostrophes',
  })
  middleName?: string;

  @ApiProperty({ example: 'Sharma', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Matches(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, {
    message: 'Last name can only contain letters, hyphens, and apostrophes',
  })
  lastName?: string;

  @ApiProperty({ example: 'MALE' })
  @IsString()
  @IsNotEmpty({ message: 'Gender is required' })
  gender: string;

  @ApiProperty({ example: '2010-05-15' })
  @IsDateString(
    {},
    { message: 'Please enter a valid date of birth (DD-MM-YYYY)' },
  )
  @IsNotEmpty({ message: 'Date of birth is required' })
  dob: string;

  @ApiProperty({ example: '1', description: 'Class ID' })
  @IsString()
  @IsNotEmpty({ message: 'Class ID is required' })
  classId: string;

  @ApiProperty({ example: '1', description: 'Section ID' })
  @IsString()
  @IsNotEmpty({ message: 'Section ID is required' })
  sectionId: string;

  @ApiProperty({ example: '1', description: 'Academic Session ID' })
  @IsString()
  @IsNotEmpty({ message: 'Academic Session ID is required' })
  academicSessionId: string;

  @ApiProperty({ example: '10', description: 'Role ID' })
  @IsString()
  @IsNotEmpty({ message: 'Role ID is required' })
  roleId: string;

  /* ── Admission / Identifier ── */
  @ApiProperty({ example: 'STU-0001', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  studentCode?: string;

  @ApiProperty({ example: 'ADM-2627-0001', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  admissionNumber?: string;

  @ApiProperty({ example: '7', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  rollNumber?: string;

  @ApiProperty({ example: '2024-06-01', required: false })
  @IsOptional()
  admissionDate?: string;

  @ApiProperty({ example: '2024-06-10', required: false })
  @IsOptional()
  joiningDate?: string;

  @ApiProperty({
    example: 'NEW',
    description: 'NEW | TRANSFER',
    required: false,
  })
  @IsString()
  @IsOptional()
  admissionType?: string;

  /* ── Personal ── */
  @ApiProperty({ example: 'O+', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^(A|B|AB|O)[+-]$/i, {
    message: 'Please enter a valid blood group (e.g. A+, O-, AB+)',
  })
  bloodGroup?: string;

  @ApiProperty({ example: 'Hindu', required: false })
  @IsString()
  @IsOptional()
  religion?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  religionId?: string;

  @ApiProperty({ example: 'General', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  casteCategoryId?: string;

  @ApiProperty({ example: 'Indian', required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ example: '123456789012', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, {
    message: 'Aadhaar number must contain exactly 12 digits',
  })
  aadhaarNumber?: string;

  @ApiProperty({
    example: '1',
    description:
      'Lookup ID for identity document type (Aadhaar, PAN, DL, Passport, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  identityDocumentTypeId?: string;

  @ApiProperty({
    example: 'ABCDE1234F',
    description: 'Identity document number',
    required: false,
  })
  @IsString()
  @IsOptional()
  identityDocumentNumber?: string;

  /* ── Contact ── */
  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid phone number (10 to 15 digits)',
  })
  phone?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian phone number',
  })
  mobile?: string;

  @ApiProperty({ example: '9898989898', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid alternate mobile number',
  })
  alternateMobile?: string;

  @ApiProperty({ example: 'rahul@example.com', required: false })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(80)
  email?: string;

  /* ── Address ── */
  @ApiProperty({ example: '123 MG Road', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  address?: string;

  @ApiProperty({ example: 'Rampur Village', required: false })
  @IsString()
  @IsOptional()
  village?: string;

  @ApiProperty({ example: 'Lucknow', required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ example: 'Uttar Pradesh', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '226001', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[1-9][0-9]{5}$/, {
    message: 'Pincode must be a valid 6-digit postal code',
  })
  pincode?: string;

  /* ── Parent (legacy generic) ── */
  @ApiProperty({ example: 'Sanjay Kumar', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  parentName?: string;

  @ApiProperty({ example: '9988776655', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid parent phone number',
  })
  parentPhone?: string;

  /* ── Father ── */
  @ApiProperty({ example: 'Ramesh Kumar', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fatherName?: string;

  @ApiProperty({ example: 'Engineer', required: false })
  @IsString()
  @IsOptional()
  fatherOccupation?: string;

  @ApiProperty({ example: '9876501234', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid father mobile number',
  })
  fatherMobile?: string;

  @ApiProperty({ example: 'ramesh@gmail.com', required: false })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid father email address' })
  fatherEmail?: string;

  @ApiProperty({ example: '123412341234', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, {
    message: 'Father Aadhaar number must contain exactly 12 digits',
  })
  fatherAadhaar?: string;

  /* ── Mother ── */
  @ApiProperty({ example: 'Sunita Kumar', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  motherName?: string;

  @ApiProperty({ example: 'Teacher', required: false })
  @IsString()
  @IsOptional()
  motherOccupation?: string;

  @ApiProperty({ example: '9876505678', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid mother mobile number',
  })
  motherMobile?: string;

  @ApiProperty({ example: 'sunita@gmail.com', required: false })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid mother email address' })
  motherEmail?: string;

  @ApiProperty({ example: '432143214321', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, {
    message: 'Mother Aadhaar number must contain exactly 12 digits',
  })
  motherAadhaar?: string;

  /* ── Guardian ── */
  @ApiProperty({ example: 'Vikram Singh', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  guardianName?: string;

  @ApiProperty({ example: 'Uncle', required: false })
  @IsString()
  @IsOptional()
  guardianRelation?: string;

  @ApiProperty({ example: '9123456789', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid guardian mobile number',
  })
  guardianMobile?: string;

  @ApiProperty({ example: 'vikram@gmail.com', required: false })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid guardian email address' })
  guardianEmail?: string;

  /* ── Emergency ── */
  @ApiProperty({ example: 'Priya Sharma', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  emergencyContactName?: string;

  @ApiProperty({ example: '9000011111', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid emergency contact phone',
  })
  emergencyContactPhone?: string;

  @ApiProperty({ example: 'Aunt', required: false })
  @IsString()
  @IsOptional()
  emergencyContactRelation?: string;

  /* ── Medical ── */
  @ApiProperty({ example: 'Mild Asthma', required: false })
  @IsString()
  @IsOptional()
  medicalCondition?: string;

  @ApiProperty({ example: 'Penicillin, Dust', required: false })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiProperty({ example: 'None', required: false })
  @IsString()
  @IsOptional()
  disability?: string;

  @ApiProperty({ example: 'Dr. Anita Roy', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  doctorName?: string;

  @ApiProperty({ example: '9830011223', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid doctor phone number',
  })
  doctorPhone?: string;

  /* ── Previous School ── */
  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  previousSchool?: Record<string, any>;

  /* ── Photo ── */
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  profilePicUrl?: string;
}
