import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 10', description: 'Name of the class' })
  @IsNotEmpty({ message: 'Class name is required' })
  @IsString()
  @Length(2, 100, { message: 'Class name must be between 2 and 100 characters' })
  @Matches(/^[a-zA-Z0-9\s.,'()&/-]+$/, {
    message:
      'Class name can only contain letters, numbers, spaces and common punctuation (.,\'()&/-)',
  })
  name: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Maximum daily attendance sessions/slots for this class',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  dailyAttendanceLimit?: number;

  @ApiPropertyOptional({
    example: 'CLASS-10',
    description: 'Code of the class',
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
    description: 'Description of the class',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    example: '5',
    description: 'SchoolUser ID of the Class Teacher',
  })
  @IsOptional()
  @IsString()
  classTeacherId?: string;

  @ApiPropertyOptional({ example: '1', description: 'Academic Session ID' })
  @IsOptional()
  @IsString()
  academicSessionId?: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Student capacity in this class',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1 student' })
  @Max(500, { message: 'Capacity cannot exceed 500 students' })
  capacity?: number;
}
