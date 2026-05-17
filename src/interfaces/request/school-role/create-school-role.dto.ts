import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolRoleDto {
  @ApiProperty({ example: 'Class Teacher', description: 'Name of the school role' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: ['1', '2', '5'],
    description: 'Optional list of Permission IDs to attach to this school role',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}
