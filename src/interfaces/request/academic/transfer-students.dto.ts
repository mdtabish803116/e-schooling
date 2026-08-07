import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferStudentsDto {
  @ApiProperty({
    example: ['1', '2'],
    description: 'List of Student Enrollment IDs to transfer',
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  studentEnrollmentIds: string[];

  @ApiProperty({ example: '3', description: 'Target Section Database ID' })
  @IsNotEmpty()
  @IsString()
  targetSectionId: string;

  @ApiPropertyOptional({
    example: 'Split class into sections',
    description: 'Reason for transfer',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
