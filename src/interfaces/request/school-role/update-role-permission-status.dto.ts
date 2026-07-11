import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateRolePermissionStatusDto {
  @ApiProperty({
    description: 'The active status to set for the role permission mapping',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
