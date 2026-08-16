import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatusEnum } from '../../../models/enums/enums';

export class TakeAttendanceRecordDto {
  @ApiProperty({
    example: '12',
    description: 'Student enrollment database primary key',
  })
  @IsNotEmpty({ message: 'Student enrollment ID is required' })
  @IsString({ message: 'Student enrollment ID must be a string' })
  studentEnrollmentId: string;

  @ApiProperty({
    example: AttendanceStatusEnum.PRESENT,
    enum: AttendanceStatusEnum,
  })
  @IsNotEmpty({ message: 'Attendance mark is required' })
  @IsEnum(AttendanceStatusEnum, {
    message: 'Please select a valid attendance status',
  })
  attendanceMark: AttendanceStatusEnum;

  @ApiPropertyOptional({
    example: 'Late due to traffic',
    description: 'Remarks',
  })
  @IsOptional()
  @IsString({ message: 'Remarks must be a string' })
  @MaxLength(255, { message: 'Remarks cannot exceed 255 characters' })
  remarks?: string;
}

export class TakeAttendanceDto {
  @ApiProperty({ example: '1', description: 'Academic Session ID' })
  @IsNotEmpty({ message: 'Academic session ID is required' })
  @IsString({ message: 'Academic session ID must be a string' })
  academicSessionId: string;

  @ApiProperty({ example: '2', description: 'Class ID' })
  @IsNotEmpty({ message: 'Class ID is required' })
  @IsString({ message: 'Class ID must be a string' })
  classId: string;

  @ApiProperty({ example: '5', description: 'Section ID' })
  @IsNotEmpty({ message: 'Section ID is required' })
  @IsString({ message: 'Section ID must be a string' })
  sectionId: string;

  @ApiProperty({
    example: '2026-05-18',
    description: 'Date in YYYY-MM-DD format',
  })
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString(
    {},
    { message: 'Please enter a valid date (YYYY-MM-DD)' },
  )
  date: string;

  @ApiProperty({
    example: 1,
    default: 1,
    description: 'Daily attendance session slot number',
  })
  @IsNotEmpty({ message: 'Session slot is required' })
  @IsInt({ message: 'Session slot must be an integer' })
  @Min(1, { message: 'Session slot must be at least 1' })
  sessionSlot: number;

  @ApiProperty({ type: [TakeAttendanceRecordDto] })
  @IsArray({ message: 'Records must be an array' })
  @ArrayMinSize(1, { message: 'At least one student record is required' })
  @ValidateNested({ each: true })
  @Type(() => TakeAttendanceRecordDto)
  records: TakeAttendanceRecordDto[];
}
