import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClassDto {
  @ApiPropertyOptional({
    example: 'Grade 10 - Redesigned',
    description: 'Updated name of the class',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Class name must be between 2 and 100 characters' })
  @Matches(/^[a-zA-Z0-9\s.,'()&/-]+$/, {
    message:
      'Class name can only contain letters, numbers, spaces and common punctuation (.,\'()&/-)',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated daily attendance limit',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  dailyAttendanceLimit?: number;

  @ApiPropertyOptional({ example: true, description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'CLASS-10',
    description: 'Updated code of the class',
  })
  @IsOptional()
  @IsString()
  @Length(1, 30, { message: 'Class code cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Class code can only contain letters, numbers, hyphens, and underscores',
  })
  classCode?: string;

  @ApiPropertyOptional({
    example: 'Grade 10 High School class',
    description: 'Updated description of the class',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    example: '5',
    description: 'Updated SchoolUser ID of the Class Teacher',
  })
  @IsOptional()
  @IsString()
  classTeacherId?: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Updated student capacity in this class',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1 student' })
  @Max(500, { message: 'Capacity cannot exceed 500 students' })
  capacity?: number;

  @ApiPropertyOptional({
    example: '10',
    description: 'Updated Academic Session ID',
  })
  @IsOptional()
  @IsString()
  academicSessionId?: string;
}
