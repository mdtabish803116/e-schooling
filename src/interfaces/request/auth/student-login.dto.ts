import { IsString, IsNotEmpty } from 'class-validator';

export class StudentLoginDto {
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  schoolCode: string;
}
