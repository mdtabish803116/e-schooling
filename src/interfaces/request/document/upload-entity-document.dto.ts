import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadEntityDocumentDto {
  @ApiProperty({ description: 'Document Master ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  documentMasterId: string;

  @ApiProperty({ description: 'Target entity type', example: 'student' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'Target entity ID', example: '42' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'File storage URL',
    example: 'https://storage.example.com/doc.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Original file name',
    example: 'aadhaar_ravi.pdf',
  })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 204800 })
  @IsInt()
  @Min(1)
  @IsOptional()
  fileSizeBytes?: number;

  @ApiPropertyOptional({ description: 'MIME type', example: 'application/pdf' })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Expiration date (YYYY-MM-DD)',
    example: '2030-12-31',
  })
  @IsString()
  @IsOptional()
  expiryDate?: string;
}
