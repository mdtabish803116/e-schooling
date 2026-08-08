import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatusEnum } from '../../../models/enums/enums';

export class UpdateAttendanceRecordDto {
  @ApiProperty({ example: '125', description: 'Attendance Record database ID' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiPropertyOptional({
    example: AttendanceStatusEnum.ABSENT,
    enum: AttendanceStatusEnum,
  })
  @IsOptional()
  @IsEnum(AttendanceStatusEnum)
  attendanceMark?: AttendanceStatusEnum;

  @ApiPropertyOptional({
    example: 'Excused sick leave',
    description: 'Remarks',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: true, description: 'Active toggle status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAttendanceDto {
  @ApiProperty({ type: [UpdateAttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAttendanceRecordDto)
  records: UpdateAttendanceRecordDto[];
}
