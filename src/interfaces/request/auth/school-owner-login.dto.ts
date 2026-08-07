import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SchoolOwnerLoginDto {
  @ApiProperty({
    example: 'rahul@school.com',
    description: 'Registered email or mobile number',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'StrongPass@123', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Force logout previous active session on conflict',
  })
  @IsOptional()
  @IsBoolean()
  forceLogoutPrevious?: boolean;
}
