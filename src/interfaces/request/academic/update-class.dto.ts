import { IsInt, IsOptional, IsString, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClassDto {
  @ApiPropertyOptional({ example: 'Grade 10 - Redesigned', description: 'Updated name of the class' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 2, description: 'Updated daily attendance limit' })
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyAttendanceLimit?: number;

  @ApiPropertyOptional({ example: true, description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
