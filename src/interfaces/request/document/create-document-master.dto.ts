import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentMasterDto {
  @ApiProperty({ description: 'Document master name', example: 'Aadhaar Card' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Unique slug code per school',
    example: 'aadhaar-card',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Government identity',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Category', example: 'identity' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Accepted file extensions',
    example: ['pdf', 'jpg', 'png'],
  })
  @IsArray()
  @IsString({ each: true })
  acceptedFileTypes: string[];

  @ApiProperty({ description: 'Max file size in MB', example: 5 })
  @IsInt()
  @Min(1)
  @Max(50)
  maxFileSizeMb: number;

  @ApiPropertyOptional({ description: 'Mandatory flag', example: false })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional({
    description: 'Applicable modules',
    example: ['students', 'staff'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableModules?: string[];

  @ApiPropertyOptional({ description: 'Track expiry date', example: false })
  @IsBoolean()
  @IsOptional()
  expiryTrackingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Verification required', example: false })
  @IsBoolean()
  @IsOptional()
  verificationRequired?: boolean;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
