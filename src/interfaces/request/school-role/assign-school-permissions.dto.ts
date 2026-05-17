import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSchoolPermissionsDto {
  @ApiProperty({
    example: ['1', '2', '5'],
    description: 'List of Permission IDs to attach to this school role',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
