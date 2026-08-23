import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '919876543210',
    description: 'Recipient mobile number or email address',
  })
  @IsNotEmpty({ message: 'Recipient is required' })
  @IsString()
  recipient: string;

  @ApiProperty({
    example: '839201',
    description: '6-digit OTP code received',
  })
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  otpCode: string;

  @ApiPropertyOptional({
    example: 'REGISTER',
    description: 'Purpose of the OTP (must match the send OTP purpose)',
  })
  @IsOptional()
  @IsString()
  purpose?: string;
}
