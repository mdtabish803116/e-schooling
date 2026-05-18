import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatusEnum } from '../../../models/enums/enums';

export class TakeAttendanceRecordDto {
  @ApiProperty({ example: '12', description: 'Student enrollment database primary key' })
  @IsNotEmpty()
  @IsString()
  studentEnrollmentId: string;

  @ApiProperty({ example: AttendanceStatusEnum.PRESENT, enum: AttendanceStatusEnum })
  @IsNotEmpty()
  @IsEnum(AttendanceStatusEnum)
  attendanceMark: AttendanceStatusEnum;

  @ApiPropertyOptional({ example: 'Late due to traffic', description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class TakeAttendanceDto {
  @ApiProperty({ example: '1', description: 'Academic Session ID' })
  @IsNotEmpty()
  @IsString()
  academicSessionId: string;

  @ApiProperty({ example: '2', description: 'Class ID' })
  @IsNotEmpty()
  @IsString()
  classId: string;

  @ApiProperty({ example: '5', description: 'Section ID' })
  @IsNotEmpty()
  @IsString()
  sectionId: string;

  @ApiProperty({ example: '2026-05-18', description: 'Date in YYYY-MM-DD format' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ example: 1, default: 1, description: 'Daily attendance session slot number' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  sessionSlot: number;

  @ApiProperty({ type: [TakeAttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TakeAttendanceRecordDto)
  records: TakeAttendanceRecordDto[];
}
