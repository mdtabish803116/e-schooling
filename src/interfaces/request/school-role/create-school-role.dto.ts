import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolRoleDto {
  @ApiProperty({ example: 'Class Teacher', description: 'Name of the school role' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Handles classroom activities and student attendance records', description: 'Optional description of the school role' })
  @IsOptional()
  @IsString()
  description?: string;
}
