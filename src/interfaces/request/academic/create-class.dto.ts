import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 10', description: 'Name of the class' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Maximum daily attendance sessions/slots for this class',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyAttendanceLimit?: number;

  @ApiPropertyOptional({
    example: 'CLASS-10',
    description: 'Code of the class',
  })
  @IsOptional()
  @IsString()
  classCode?: string;

  @ApiPropertyOptional({
    example: 'Grade 10 High School class',
    description: 'Description of the class',
  })
  @IsOptional()
  @IsString()
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
  @Min(1)
  capacity?: number;
}
