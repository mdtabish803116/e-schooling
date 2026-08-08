import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomDto {
  @ApiProperty({ example: 'Room 102', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Science Wing', required: false })
  @IsString()
  @IsOptional()
  block?: string;

  @ApiProperty({ example: 2, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  floor?: number;

  @ApiProperty({ example: 45, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: ['Smartboard', 'AC'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipment?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
