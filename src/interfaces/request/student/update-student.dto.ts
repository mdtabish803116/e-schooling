import {
  IsString,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Used by PATCH /schools/:schoolId/students/:studentId
 * All fields are optional — only provided fields will be updated.
 */
export class UpdateStudentDto {
  /* ── Personal ── */
  @IsString() @IsOptional() @MinLength(2) @MaxLength(50) firstName?: string;
  @IsString() @IsOptional() @MaxLength(50) middleName?: string;
  @IsString() @IsOptional() @MaxLength(50) lastName?: string;
  @IsString() @IsOptional() gender?: string;
  @IsOptional() dob?: string;
  @IsString() @IsOptional() bloodGroup?: string;
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
  @IsString() @IsOptional() phone?: string;
  @IsString()
  @IsOptional()
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian phone number',
  })
  mobile?: string;
  @IsString() @IsOptional() alternateMobile?: string;
  @IsString() @IsOptional() @IsEmail() @MaxLength(50) email?: string;

  /* ── Address ── */
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() village?: string;
  @IsString() @IsOptional() district?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() pincode?: string;

  /* ── Parent / Guardian ── */
  @IsString() @IsOptional() parentName?: string;
  @IsString() @IsOptional() parentPhone?: string;
  @IsString() @IsOptional() fatherName?: string;
  @IsString() @IsOptional() fatherOccupation?: string;
  @IsString() @IsOptional() fatherMobile?: string;
  @IsString() @IsOptional() fatherEmail?: string;
  @IsString() @IsOptional() fatherAadhaar?: string;
  @IsString() @IsOptional() motherName?: string;
  @IsString() @IsOptional() motherOccupation?: string;
  @IsString() @IsOptional() motherMobile?: string;
  @IsString() @IsOptional() motherEmail?: string;
  @IsString() @IsOptional() motherAadhaar?: string;
  @IsString() @IsOptional() guardianName?: string;
  @IsString() @IsOptional() guardianRelation?: string;
  @IsString() @IsOptional() guardianMobile?: string;
  @IsString() @IsOptional() guardianEmail?: string;

  /* ── Emergency ── */
  @IsString() @IsOptional() emergencyContactName?: string;
  @IsString() @IsOptional() emergencyContactPhone?: string;
  @IsString() @IsOptional() emergencyContactRelation?: string;

  /* ── Medical ── */
  @IsString() @IsOptional() medicalCondition?: string;
  @IsString() @IsOptional() allergies?: string;
  @IsString() @IsOptional() disability?: string;
  @IsString() @IsOptional() doctorName?: string;
  @IsString() @IsOptional() doctorPhone?: string;

  /* ── Admission & Codes ── */
  @IsString() @IsOptional() studentCode?: string;
  @IsString() @IsOptional() admissionNumber?: string;
  @IsString() @IsOptional() rollNumber?: string;
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
