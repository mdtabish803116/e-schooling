import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSectionDto {
  @ApiPropertyOptional({
    example: 'Section A',
    description: 'Updated name of the section',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true, description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 45,
    description: 'Updated student capacity in this section',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    example: '5',
    description: 'SchoolUser ID of the Section Teacher',
  })
  @IsOptional()
  @IsString()
  classTeacherId?: string;

  @ApiPropertyOptional({
    example: 'Room 101',
    description: 'Assigned classroom',
  })
  @IsOptional()
  @IsString()
  room?: string;
}
