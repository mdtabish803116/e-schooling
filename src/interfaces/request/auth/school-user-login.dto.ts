import { IsString, IsNotEmpty } from 'class-validator';

export class SchoolUserLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  schoolCode: string;
}
