import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSectionDto {
  @ApiPropertyOptional({ example: 'Section A', description: 'Updated name of the section' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true, description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
