import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Used by PATCH /schools/:schoolId/students/:studentId
 * All fields are optional — only provided fields will be updated.
 */
export class UpdateStudentDto {
  /* ── Personal ── */
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsString() @IsOptional() gender?: string;
  @IsOptional() dob?: string;
  @IsString() @IsOptional() bloodGroup?: string;
  @IsString() @IsOptional() religion?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() nationality?: string;
  @IsString() @IsOptional() aadhaarNumber?: string;

  /* ── Contact ── */
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() mobile?: string;
  @IsString() @IsOptional() alternateMobile?: string;
  @IsString() @IsOptional() email?: string;

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

  /* ── Admission ── */
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
