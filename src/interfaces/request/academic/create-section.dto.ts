import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ example: '1', description: 'Parent Class Database ID' })
  @IsNotEmpty()
  @IsString()
  classId: string;

  @ApiProperty({ example: 'Section A', description: 'Name of the section' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
