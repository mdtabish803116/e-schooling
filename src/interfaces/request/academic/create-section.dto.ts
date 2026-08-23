import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ example: '1', description: 'Parent Class Database ID' })
  @IsNotEmpty({ message: 'Class ID is required' })
  @IsString()
  classId: string;

  @ApiProperty({ example: 'Section A', description: 'Name of the section' })
  @IsNotEmpty({ message: 'Section name is required' })
  @IsString()
  @Length(1, 50, { message: 'Section name must be between 1 and 50 characters' })
  @Matches(/^[A-Za-z0-9\s.,'()&/-]+$/, {
    message:
      'Section name can only contain letters, numbers, spaces, and punctuation',
  })
  name: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Maximum student capacity in this section',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1 student' })
  @Max(500, { message: 'Capacity cannot exceed 500 students' })
  capacity?: number;

  @ApiPropertyOptional({
    example: '5',
    description: 'SchoolUser ID of the Section Teacher',
  })
  @IsOptional()
  @IsString()
  classTeacherId?: string;

  @ApiPropertyOptional({
    example: 'Room 101',
    description: 'Assigned classroom',
  })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  @Matches(/^[A-Za-z0-9\s.-]*$/, {
    message: 'Room can only contain alphanumeric characters, spaces, dots and hyphens',
  })
  room?: string;

  @ApiPropertyOptional({ example: '1', description: 'Academic Session ID' })
  @IsOptional()
  @IsString()
  academicSessionId?: string;
}
