import { IsInt, IsOptional, IsString, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClassDto {
  @ApiPropertyOptional({
    example: 'Grade 10 - Redesigned',
    description: 'Updated name of the class',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated daily attendance limit',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
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
  classCode?: string;

  @ApiPropertyOptional({
    example: 'Grade 10 High School class',
    description: 'Updated description of the class',
  })
  @IsOptional()
  @IsString()
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
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    example: '10',
    description: 'Updated Academic Session ID',
  })
  @IsOptional()
  @IsString()
  academicSessionId?: string;
}
