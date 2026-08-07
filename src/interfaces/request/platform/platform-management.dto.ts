import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlatformFeatureDto {
  @ApiProperty({
    example: 'WhatsApp Integration',
    description: 'Display name of the feature',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'WHATSAPP',
    description: 'Unique feature code (internally generated if not provided)',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    example: 'Enables WhatsApp messaging for attendance and fees',
    description: 'Detailed description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateModuleMasterDto {
  @ApiProperty({
    example: 'Attendance Management',
    description: 'Module display name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'ATTENDANCE',
    description: 'Unique module code (internally generated if not provided)',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    example: 'Track student and teacher daily attendance',
    description: 'Description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'Link to a PlatformFeature ID',
  })
  @IsString()
  @IsOptional()
  platformFeatureId?: string;

  @ApiPropertyOptional({
    example: '0',
    description: 'Parent module ID for nested menus',
  })
  @IsString()
  @IsOptional()
  parentModuleId?: string;

  @ApiPropertyOptional({
    example: '/attendance',
    description: 'Frontend route path',
  })
  @IsString()
  @IsOptional()
  routePath?: string;

  @ApiPropertyOptional({
    example: 'calendar-check',
    description: 'Icon identifier',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: true, description: 'Visibility in sidebar' })
  @IsBoolean()
  @IsOptional()
  showInSidebar?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a grouping folder',
  })
  @IsBoolean()
  @IsOptional()
  isMenuGroup?: boolean;
}

export class CreateOperationMasterDto {
  @ApiProperty({ example: 'Create', description: 'Action name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'CREATE',
    description: 'Unique action code (internally generated if not provided)',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    example: 'Ability to create new records',
    description: 'Action description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignPermissionDto {
  @ApiProperty({ example: '1', description: 'Module ID' })
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({
    example: ['1', '2'],
    description: 'List of Operation IDs',
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  operationIds: string[];

  @ApiPropertyOptional({
    example: 'Can take attendance for students',
    description: 'Description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
