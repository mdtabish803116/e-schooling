import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSchoolRoleDto {
  @ApiPropertyOptional({
    example: 'Senior Teacher',
    description: 'Name of the school role',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Handles senior classes and curriculum scheduling',
    description: 'Description of the school role',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
