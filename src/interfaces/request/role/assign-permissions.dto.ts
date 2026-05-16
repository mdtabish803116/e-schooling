import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({
    example: ['1', '2', '5'],
    description: 'List of Permission IDs to attach to this role',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
