import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateAcademicSessionDto {
  @ApiPropertyOptional({ example: '2025-2026', description: 'Session name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '2025-04-01',
    description: 'Session start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-03-31',
    description: 'Session end date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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
