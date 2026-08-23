import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    example: '919876543210',
    description: 'Recipient mobile number or email address',
  })
  @IsNotEmpty({ message: 'Recipient mobile or email is required' })
  @IsString()
  recipient: string;

  @ApiPropertyOptional({
    example: 'sms',
    enum: ['sms', 'email'],
    description: 'Channel to send OTP (sms or email)',
  })
  @IsOptional()
  @IsString()
  channel?: 'sms' | 'email';

  @ApiPropertyOptional({
    example: 'REGISTER',
    description: 'Purpose of the OTP (e.g. REGISTER, LOGIN, FORGOT_PASSWORD)',
  })
  @IsOptional()
  @IsString()
  purpose?: string;
}
