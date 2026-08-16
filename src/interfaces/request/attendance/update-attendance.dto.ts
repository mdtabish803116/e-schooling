import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatusEnum } from '../../../models/enums/enums';

export class UpdateAttendanceRecordDto {
  @ApiProperty({ example: '125', description: 'Attendance Record database ID' })
  @IsNotEmpty({ message: 'Attendance record ID is required' })
  @IsString({ message: 'Attendance record ID must be a string' })
  id: string;

  @ApiPropertyOptional({
    example: AttendanceStatusEnum.ABSENT,
    enum: AttendanceStatusEnum,
  })
  @IsOptional()
  @IsEnum(AttendanceStatusEnum, {
    message: 'Please select a valid attendance status',
  })
  attendanceMark?: AttendanceStatusEnum;

  @ApiPropertyOptional({
    example: 'Excused sick leave',
    description: 'Remarks',
  })
  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @MaxLength(255, { message: 'Remarks cannot exceed 255 characters' })
  remarks?: string;

  @ApiPropertyOptional({ example: true, description: 'Active toggle status' })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}

export class UpdateAttendanceDto {
  @ApiProperty({ type: [UpdateAttendanceRecordDto] })
  @IsArray({ message: 'Records must be an array' })
  @ArrayMinSize(1, { message: 'At least one record is required' })
  @ValidateNested({ each: true })
  @Type(() => UpdateAttendanceRecordDto)
  records: UpdateAttendanceRecordDto[];
}
