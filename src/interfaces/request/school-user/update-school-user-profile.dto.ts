import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class UpdateSchoolUserProfileDto {
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
}
