import { IsString, IsOptional, Allow } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AllocateRoomDto {
  @ApiProperty({
    example: '42',
    description: 'Section ID to assign to this room. Pass null to unassign.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  sectionId: string | null;
}
