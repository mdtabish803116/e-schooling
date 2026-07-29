import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CopyAcademicSessionDataDto {
  @ApiProperty({ example: '1', description: 'Source Academic Session ID' })
  @IsNotEmpty()
  @IsString()
  fromAcademicSessionId: string;

  @ApiProperty({ example: '2', description: 'Target Academic Session ID' })
  @IsNotEmpty()
  @IsString()
  toAcademicSessionId: string;

  @ApiPropertyOptional({
    example: ['classes', 'sections', 'subjects', 'mappings', 'rooms'],
    description: 'Modules to copy from previous academic session. Defaults to all if omitted.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];
}
