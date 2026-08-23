import {
  IsString,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
} from 'class-validator';

/**
 * Used by PATCH /schools/:schoolId/students/:studentId
 * All fields are optional — only provided fields will be updated.
 */
export class UpdateStudentDto {
  /* ── Personal ── */
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Matches(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, {
    message: 'First name can only contain letters, hyphens, and apostrophes',
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Middle name cannot exceed 50 characters' })
  @Matches(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, {
    message: 'Middle name can only contain letters, hyphens, and apostrophes',
  })
  middleName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Matches(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/, {
    message: 'Last name can only contain letters, hyphens, and apostrophes',
  })
  lastName?: string;

  @IsString() @IsOptional() gender?: string;
  @IsOptional() dob?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(A|B|AB|O)[+-]$/i, {
    message: 'Please enter a valid blood group (e.g. A+, O-, AB+)',
  })
  bloodGroup?: string;

  @IsString() @IsOptional() religion?: string;
  @IsString() @IsOptional() religionId?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() casteCategoryId?: string;
  @IsString() @IsOptional() nationality?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, {
    message: 'Aadhaar number must contain exactly 12 digits',
  })
  aadhaarNumber?: string;

  @IsString() @IsOptional() identityDocumentTypeId?: string;
  @IsString() @IsOptional() identityDocumentNumber?: string;

  /* ── Contact ── */
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid phone number',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian phone number',
  })
  mobile?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid alternate mobile number',
  })
  alternateMobile?: string;

  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(80)
  email?: string;

  /* ── Address ── */
  @IsString() @IsOptional() @MaxLength(250) address?: string;
  @IsString() @IsOptional() village?: string;
  @IsString() @IsOptional() district?: string;
  @IsString() @IsOptional() state?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[1-9][0-9]{5}$/, {
    message: 'Pincode must be a valid 6-digit postal code',
  })
  pincode?: string;

  /* ── Parent / Guardian ── */
  @IsString() @IsOptional() @MaxLength(100) parentName?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid parent phone number',
  })
  parentPhone?: string;

  @IsString() @IsOptional() @MaxLength(100) fatherName?: string;
  @IsString() @IsOptional() fatherOccupation?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid father mobile number',
  })
  fatherMobile?: string;
  @IsString() @IsOptional() @IsEmail() fatherEmail?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, {
    message: 'Father Aadhaar number must contain exactly 12 digits',
  })
  fatherAadhaar?: string;

  @IsString() @IsOptional() @MaxLength(100) motherName?: string;
  @IsString() @IsOptional() motherOccupation?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid mother mobile number',
  })
  motherMobile?: string;
  @IsString() @IsOptional() @IsEmail() motherEmail?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{12}$/, {
    message: 'Mother Aadhaar number must contain exactly 12 digits',
  })
  motherAadhaar?: string;

  @IsString() @IsOptional() @MaxLength(100) guardianName?: string;
  @IsString() @IsOptional() guardianRelation?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid guardian mobile number',
  })
  guardianMobile?: string;
  @IsString() @IsOptional() @IsEmail() guardianEmail?: string;

  /* ── Emergency ── */
  @IsString() @IsOptional() @MaxLength(100) emergencyContactName?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid emergency contact phone',
  })
  emergencyContactPhone?: string;
  @IsString() @IsOptional() emergencyContactRelation?: string;

  /* ── Medical ── */
  @IsString() @IsOptional() medicalCondition?: string;
  @IsString() @IsOptional() allergies?: string;
  @IsString() @IsOptional() disability?: string;
  @IsString() @IsOptional() @MaxLength(100) doctorName?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,15}$/, {
    message: 'Please enter a valid doctor phone number',
  })
  doctorPhone?: string;

  /* ── Admission & Codes ── */
  @IsString() @IsOptional() @MaxLength(30) studentCode?: string;
  @IsString() @IsOptional() @MaxLength(30) admissionNumber?: string;
  @IsString() @IsOptional() @MaxLength(20) rollNumber?: string;
  @IsOptional() admissionDate?: string;
  @IsOptional() joiningDate?: string;
  @IsString() @IsOptional() admissionType?: string;

  /* ── Status ── */
  @IsString() @IsOptional() status?: string;

  /* ── Previous School ── */
  @IsObject() @IsOptional() previousSchool?: Record<string, any>;

  /* ── Photo ── */
  @IsString() @IsOptional() profilePicUrl?: string;
}
