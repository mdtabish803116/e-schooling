import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PeriodTypeEnum,
  TimetableEventTypeEnum,
} from '../../../../../models/enums/enums';

export class CreateTimetableDto {
  @ApiProperty({ example: 'Academic Year 2026-2027 Timetable' })
  @IsNotEmpty({ message: 'Timetable name is required' })
  @IsString({ message: 'Timetable name must be a string' })
  @MaxLength(100, { message: 'Timetable name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString({ message: 'Academic session ID must be a string' })
  academicSessionId?: string;
}

export class CreatePeriodDto {
  @ApiProperty({ example: 'Period 1' })
  @IsNotEmpty({ message: 'Period name is required' })
  @IsString({ message: 'Period name must be a string' })
  @MaxLength(50, { message: 'Period name cannot exceed 50 characters' })
  name: string;

  @ApiProperty({ example: '09:00', description: 'HH:mm format' })
  @IsNotEmpty({ message: 'Start time is required' })
  @IsString({ message: 'Start time must be a string' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Start time must be in HH:mm 24-hour format',
  })
  startTime: string;

  @ApiProperty({ example: '09:45', description: 'HH:mm format' })
  @IsNotEmpty({ message: 'End time is required' })
  @IsString({ message: 'End time must be a string' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'End time must be in HH:mm 24-hour format',
  })
  endTime: string;

  @ApiPropertyOptional({ enum: PeriodTypeEnum })
  @IsOptional()
  @IsEnum(PeriodTypeEnum, { message: 'Please select a valid period type' })
  type?: PeriodTypeEnum;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber({}, { message: 'Display order must be a number' })
  @Min(1, { message: 'Display order must be at least 1' })
  displayOrder?: number;
}

export class AssignSlotDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty({ message: 'Timetable ID is required' })
  @IsString({ message: 'Timetable ID must be a string' })
  timetableId: string;

  @ApiProperty({ example: 'Monday' })
  @IsNotEmpty({ message: 'Day is required' })
  @IsString({ message: 'Day must be a string' })
  day: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty({ message: 'Period ID is required' })
  @IsString({ message: 'Period ID must be a string' })
  periodId: string;

  @ApiProperty({ example: '5' })
  @IsNotEmpty({ message: 'Teacher ID is required' })
  @IsString({ message: 'Teacher ID must be a string' })
  teacherId: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString({ message: 'Teacher name must be a string' })
  teacherName?: string;

  @ApiPropertyOptional({ example: 'Room 101' })
  @IsOptional()
  @IsString({ message: 'Room number must be a string' })
  @MaxLength(20, { message: 'Room number cannot exceed 20 characters' })
  roomNo?: string;

  @ApiProperty({ example: '2' })
  @IsNotEmpty({ message: 'Class ID is required' })
  @IsString({ message: 'Class ID must be a string' })
  classId: string;

  @ApiProperty({ example: '3' })
  @IsNotEmpty({ message: 'Section ID is required' })
  @IsString({ message: 'Section ID must be a string' })
  sectionId: string;

  @ApiProperty({ example: '4' })
  @IsNotEmpty({ message: 'Subject ID is required' })
  @IsString({ message: 'Subject ID must be a string' })
  subjectId: string;
}

export class SubstituteTeacherDto {
  @ApiProperty({ example: '10' })
  @IsNotEmpty({ message: 'Slot ID is required' })
  @IsString({ message: 'Slot ID must be a string' })
  slotId: string;

  @ApiProperty({ example: '5' })
  @IsNotEmpty({ message: 'Original teacher ID is required' })
  @IsString({ message: 'Original teacher ID must be a string' })
  originalTeacherId: string;

  @ApiProperty({ example: '8' })
  @IsNotEmpty({ message: 'Substitute teacher ID is required' })
  @IsString({ message: 'Substitute teacher ID must be a string' })
  substituteTeacherId: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsNotEmpty({ message: 'Date is required' })
  @IsString({ message: 'Date must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty({ message: 'Period ID is required' })
  @IsString({ message: 'Period ID must be a string' })
  periodId: string;
}

export class TimetableEventDto {
  @ApiProperty({ example: 'Annual Sports Day' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @ApiPropertyOptional({ example: 'Track and field competitions' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiProperty({ example: '2026-11-20' })
  @IsNotEmpty({ message: 'Date is required' })
  @IsString({ message: 'Date must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({ example: '08:00' })
  @IsNotEmpty({ message: 'Start time is required' })
  @IsString({ message: 'Start time must be a string' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Start time must be in HH:mm 24-hour format',
  })
  startTime: string;

  @ApiProperty({ example: '14:00' })
  @IsNotEmpty({ message: 'End time is required' })
  @IsString({ message: 'End time must be a string' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'End time must be in HH:mm 24-hour format',
  })
  endTime: string;

  @ApiPropertyOptional({ enum: TimetableEventTypeEnum })
  @IsOptional()
  @IsEnum(TimetableEventTypeEnum, {
    message: 'Please select a valid event type',
  })
  type?: TimetableEventTypeEnum;

  @ApiPropertyOptional({ example: 'Main Playground' })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location?: string;
}
