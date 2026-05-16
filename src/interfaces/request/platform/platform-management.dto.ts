import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlatformFeatureDto {
  @ApiProperty({ example: 'WhatsApp Integration', description: 'Display name of the feature' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WHATSAPP', description: 'Unique feature code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'Enables WhatsApp messaging for attendance and fees', description: 'Detailed description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateModuleMasterDto {
  @ApiProperty({ example: 'Attendance Management', description: 'Module display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ATTENDANCE', description: 'Unique module code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'Track student and teacher daily attendance', description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '1', description: 'Link to a PlatformFeature ID' })
  @IsString()
  @IsOptional()
  platformFeatureId?: string;

  @ApiPropertyOptional({ example: '0', description: 'Parent module ID for nested menus' })
  @IsString()
  @IsOptional()
  parentModuleId?: string;

  @ApiPropertyOptional({ example: '/attendance', description: 'Frontend route path' })
  @IsString()
  @IsOptional()
  routePath?: string;

  @ApiPropertyOptional({ example: 'calendar-check', description: 'Icon identifier' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: true, description: 'Visibility in sidebar' })
  @IsBoolean()
  @IsOptional()
  showInSidebar?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether this is a grouping folder' })
  @IsBoolean()
  @IsOptional()
  isMenuGroup?: boolean;
}
