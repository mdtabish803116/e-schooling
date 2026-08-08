import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
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
}
