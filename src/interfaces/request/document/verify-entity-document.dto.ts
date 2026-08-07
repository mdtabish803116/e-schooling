import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyEntityDocumentDto {
  @ApiProperty({
    description: 'Verification status: verified | rejected | pending',
    example: 'verified',
  })
  @IsString()
  @IsNotEmpty()
  verificationStatus: string;

  @ApiPropertyOptional({
    description: 'Rejection reason if rejected',
    example: 'Blurry image',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
