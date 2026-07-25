import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Room 101', description: 'Room name or number' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Main Block', required: false })
  @IsString()
  @IsOptional()
  block?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  floor?: number;

  @ApiProperty({ example: 40, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: ['Smartboard', 'AC', 'Projector'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipment?: string[];
}
