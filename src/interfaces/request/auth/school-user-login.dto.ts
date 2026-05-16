import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchoolUserLoginDto {
  @ApiProperty({ example: 'teacher_rahul', description: 'Unique username assigned by school' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'rahul@123', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'SCH-BLUE-1234', description: 'Unique internal school code' })
  @IsString()
  @IsNotEmpty()
  schoolCode: string;
}
