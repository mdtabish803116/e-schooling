import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty({
    example: 'Vidya Jyoti Public School',
    description: 'Name of the school',
  })
  @IsNotEmpty({ message: 'School name is required' })
  @IsString()
  @Length(3, 150, {
    message: 'School name must be between 3 and 150 characters',
  })
  schoolName: string;

  @ApiProperty({
    example: 'school@vidyajyoti.com',
    description: 'Primary contact email',
  })
  @IsNotEmpty({ message: 'School email is required' })
  @IsEmail({}, { message: 'Please enter a valid school email address' })
  email: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Primary contact phone number',
  })
  @IsNotEmpty({ message: 'School phone number is required' })
  @IsString()
  @Matches(/^[0-9+() -]{10,20}$/, {
    message: 'Please enter a valid phone number (10 to 15 digits)',
  })
  phone: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    description: 'School logo URL',
  })
  @IsOptional()
  @IsString()
  @Length(0, 2048)
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'EXT-CBSE-9988',
    description: 'External / Board school code if any',
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  externalSchoolCode?: string;

  @ApiPropertyOptional({
    example: 'CBSE',
    description: 'Affiliation board (e.g. CBSE, ICSE, STATE_BOARD, OTHER)',
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  board?: string;

  @ApiPropertyOptional({
    example: 'English',
    description: 'Instruction medium (e.g. English, Hindi, Regional)',
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  medium?: string;

  @ApiPropertyOptional({
    example: 'PRIVATE',
    description: 'School category / type',
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  schoolType?: string;

  @ApiPropertyOptional({ example: 2010, description: 'Establishment Year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1800, { message: 'Invalid establishment year' })
  @Max(new Date().getFullYear(), {
    message: 'Establishment year cannot be in the future',
  })
  establishedYear?: number;

  @ApiPropertyOptional({ example: 12, description: 'Total classes available' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalClasses?: number;

  @ApiPropertyOptional({
    example: 24,
    description: 'Total sections across all classes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalSections?: number;

  @ApiPropertyOptional({ example: 1200, description: 'Total active students' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalStudents?: number;

  @ApiPropertyOptional({ example: 45, description: 'Total employed teachers' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalTeachers?: number;

  @ApiPropertyOptional({ example: 'Civil Lines', description: 'Locality/Area' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  addressArea?: string;

  @ApiPropertyOptional({
    example: 'Near Metro Station',
    description: 'Landmark',
  })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  addressLandmark?: string;

  @ApiPropertyOptional({ example: 'New Delhi', description: 'City' })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'City must be between 2 and 100 characters' })
  addressCity?: string;

  @ApiPropertyOptional({ example: 'Central Delhi', description: 'District' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  addressDistrict?: string;

  @ApiPropertyOptional({ example: 'Delhi', description: 'State' })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'State must be between 2 and 100 characters' })
  addressState?: string;

  @ApiPropertyOptional({ example: '110001', description: 'Postal Pincode' })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, {
    message: 'Please enter a valid 6-digit postal pincode',
  })
  addressPincode?: string;
}
