import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSchoolRoleDto {
  @ApiProperty({
    example: ['1', '3'],
    description: 'List of School Role IDs to assign to the school user',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}
