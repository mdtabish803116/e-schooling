import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentLoginDto {
  @ApiProperty({
    example: 'SCH-BLUE-2024-001',
    description: 'Unique student admission code',
  })
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @ApiProperty({
    example: '2010-05-15',
    description: 'Password (default is DOB in YYYY-MM-DD format)',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'SCH-BLUE-1234',
    description: 'Unique internal school code',
  })
  @IsString()
  @IsNotEmpty()
  schoolCode: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Force logout previous active session on conflict',
  })
  @IsOptional()
  @IsBoolean()
  forceLogoutPrevious?: boolean;

  @ApiPropertyOptional({
    example: 'cap_123456789',
    description: 'Backend generated Captcha ID',
  })
  @IsOptional()
  @IsString()
  captchaId?: string;

  @ApiPropertyOptional({
    example: 'X7K2P9',
    description: 'User entered captcha code',
  })
  @IsOptional()
  @IsString()
  captchaInput?: string;
}
