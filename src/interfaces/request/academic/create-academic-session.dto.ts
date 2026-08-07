import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateAcademicSessionDto {
  @ApiProperty({
    example: '2025-2026',
    description: 'Session name (e.g. 2025-2026)',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '2025-04-01',
    description: 'Session start date (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-03-31',
    description: 'Session end date (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this is the current active session',
  })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Active status toggle' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
