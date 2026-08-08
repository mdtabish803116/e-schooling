import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserTypeEnum } from '../../../models/enums/enums';
import { UpdateSchoolUserProfileDto } from './update-school-user-profile.dto';

export class CreateSchoolUserDto {
  @ApiProperty({
    example: 'Priya Sharma',
    description: 'Full name of the user',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'priya.sharma',
    description: 'Unique username for this user within the school',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'TempPass@123',
    description: 'Initial password (min 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: [UserTypeEnum.ACADEMIC, UserTypeEnum.NON_ACADEMIC],
    example: UserTypeEnum.ACADEMIC,
    description: 'Primary user type',
  })
  @IsNotEmpty()
  @IsEnum([UserTypeEnum.ACADEMIC, UserTypeEnum.NON_ACADEMIC])
  userType: UserTypeEnum;

  @ApiPropertyOptional({ description: 'Optional list of role IDs to assign' })
  @IsOptional()
  @IsArray()
  roleIds?: string[];

  @ApiPropertyOptional({ description: 'Optional initial profile details' })
  @IsOptional()
  @IsObject()
  profile?: UpdateSchoolUserProfileDto;
}
