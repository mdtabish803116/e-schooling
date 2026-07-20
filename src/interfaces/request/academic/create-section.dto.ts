import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ example: '1', description: 'Parent Class Database ID' })
  @IsNotEmpty()
  @IsString()
  classId: string;

  @ApiProperty({ example: 'Section A', description: 'Name of the section' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 40, description: 'Maximum student capacity in this section' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: '5', description: 'SchoolUser ID of the Section Teacher' })
  @IsOptional()
  @IsString()
  classTeacherId?: string;

  @ApiPropertyOptional({ example: 'Room 101', description: 'Assigned classroom' })
  @IsOptional()
  @IsString()
  room?: string;
}
