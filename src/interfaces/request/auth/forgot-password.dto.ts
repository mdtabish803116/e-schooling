import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiPropertyOptional({ example: 'rahul@school.com', description: 'Registered email address (for owners)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'teacher_rahul', description: 'Unique username (for school staff)' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'SCH-BLUE', description: 'Internal school code (required for school staff)' })
  @IsOptional()
  @IsString()
  schoolCode?: string;
}
