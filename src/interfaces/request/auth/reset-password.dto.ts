import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
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

  @ApiProperty({ example: '123456', description: 'The verification token/OTP received' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPass@123', description: 'New password (min 6 characters)', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
