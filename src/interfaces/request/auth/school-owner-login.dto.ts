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

  @ApiPropertyOptional({
    example: 'cap_123456789',
    description: 'Backend generated Captcha ID',
  })
  @IsOptional()
  @IsString()
  captchaId?: string;

  @ApiPropertyOptional({
    example: 'X7K2P9',
    description: 'User entered captcha code',
  })
  @IsOptional()
  @IsString()
  captchaInput?: string;
}
