import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSchoolDto {
  @ApiProperty({
    example: 'Vidya Jyoti Public School',
    description: 'Name of the school',
  })
  @IsNotEmpty()
  @IsString()
  schoolName: string;

  @ApiProperty({
    example: 'school@vidyajyoti.com',
    description: 'Primary contact email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Primary contact phone number',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    description: 'School logo URL',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'EXT-CBSE-9988',
    description: 'External / Board school code if any',
  })
  @IsOptional()
  @IsString()
  externalSchoolCode?: string;

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
  addressArea?: string;

  @ApiPropertyOptional({
    example: 'Near Metro Station',
    description: 'Landmark',
  })
  @IsOptional()
  @IsString()
  addressLandmark?: string;

  @ApiPropertyOptional({ example: 'New Delhi', description: 'City' })
  @IsOptional()
  @IsString()
  addressCity?: string;

  @ApiPropertyOptional({ example: 'Central Delhi', description: 'District' })
  @IsOptional()
  @IsString()
  addressDistrict?: string;

  @ApiPropertyOptional({ example: 'Delhi', description: 'State' })
  @IsOptional()
  @IsString()
  addressState?: string;

  @ApiPropertyOptional({ example: '110001', description: 'Postal Pincode' })
  @IsOptional()
  @IsString()
  addressPincode?: string;
}
