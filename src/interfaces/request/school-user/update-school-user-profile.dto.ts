import { IsString, IsOptional, IsDateString, IsInt, Min, IsArray, IsNumber } from 'class-validator';

export class UpdateSchoolUserProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  departmentName?: string;

  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @IsString()
  @IsOptional()
  fatherName?: string;

  @IsString()
  @IsOptional()
  motherName?: string;

  @IsString()
  @IsOptional()
  profilePicUrl?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  aadhaarNumber?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  previousOrganization?: string;

  @IsString()
  @IsOptional()
  expertise?: string;

  @IsString()
  @IsOptional()
  subjects?: string;

  @IsString()
  @IsOptional()
  employmentStatus?: string;

  @IsArray()
  @IsOptional()
  qualifications?: any[];

  @IsArray()
  @IsOptional()
  experience?: any[];

  @IsArray()
  @IsOptional()
  documents?: any[];

  @IsArray()
  @IsOptional()
  assignedClasses?: any[];

  @IsArray()
  @IsOptional()
  assignedSubjects?: any[];

  @IsArray()
  @IsOptional()
  timetableAssignments?: any[];

  @IsString()
  @IsOptional()
  salaryType?: string;

  @IsNumber()
  @IsOptional()
  baseSalary?: number;

  @IsNumber()
  @IsOptional()
  allowances?: number;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  ifscCode?: string;

  @IsString()
  @IsOptional()
  panNumber?: string;
}
