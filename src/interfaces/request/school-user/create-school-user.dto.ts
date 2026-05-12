import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserTypeEnum } from '../../../models/enums/enums';

export class CreateSchoolUserDto {
  @ApiProperty({ example: 'Priya Sharma', description: 'Full name of the user' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'priya.sharma', description: 'Unique username for this user within the school' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'TempPass@123', description: 'Initial password (min 6 characters)', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: [UserTypeEnum.TEACHER, UserTypeEnum.ACCOUNTANT, UserTypeEnum.ADMIN, UserTypeEnum.STAFF],
    example: UserTypeEnum.TEACHER,
    description: 'Primary user type',
  })
  @IsNotEmpty()
  @IsEnum([UserTypeEnum.TEACHER, UserTypeEnum.ACCOUNTANT, UserTypeEnum.ADMIN, UserTypeEnum.STAFF])
  userType: UserTypeEnum;

}
