import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 10', description: 'Name of the class' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Maximum daily attendance sessions/slots for this class' })
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyAttendanceLimit?: number;
}
