import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlatformLoginDto {
  @ApiProperty({
    example: 'admin@eschool.com',
    description: 'Platform admin email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin@123', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsBoolean()
  forceLogoutPrevious?: boolean;

  @IsOptional()
  @IsBoolean()
  forceLogout?: boolean;

  @IsOptional()
  @IsBoolean()
  revokeAllPreviousSessions?: boolean;

  @IsOptional()
  @IsBoolean()
  logoutAllOtherSessions?: boolean;

  @IsOptional()
  @IsString()
  captchaId?: string;

  @IsOptional()
  @IsString()
  captchaInput?: string;
}
