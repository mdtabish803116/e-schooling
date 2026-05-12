import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchoolOwnerRegisterDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'Full name of the school owner' })
  @IsNotEmpty()
  @IsString()
  ownerName: string;

  @ApiProperty({ example: 'rahul@school.com', description: 'Email address of the school owner' })
  @IsNotEmpty()
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ example: '+919876543210', description: 'Phone number of the school owner' })
  @IsNotEmpty()
  @IsString()
  ownerPhone: string;

  @ApiProperty({ example: 'StrongPass@123', description: 'Password (min 6 characters)', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
