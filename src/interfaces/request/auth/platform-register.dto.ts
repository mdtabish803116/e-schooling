import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlatformRoleEnum } from '../../../models/enums/enums';

export class PlatformRegisterDto {
  @ApiProperty({ example: 'Super Admin', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@eschool.com', description: 'Platform admin email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin@123', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password: string;

}
