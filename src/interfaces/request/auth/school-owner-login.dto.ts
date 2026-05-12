import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchoolOwnerLoginDto {
  @ApiProperty({ example: 'rahul@school.com', description: 'Registered email of the school owner' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass@123', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

