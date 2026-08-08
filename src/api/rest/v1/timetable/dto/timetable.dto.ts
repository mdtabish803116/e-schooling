import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import {
  PeriodTypeEnum,
  TimetableEventTypeEnum,
} from '../../../../../models/enums/enums';

export class CreatePeriodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ enum: PeriodTypeEnum })
  @IsOptional()
  @IsEnum(PeriodTypeEnum)
  type?: PeriodTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class AssignSlotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timetableId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;
}

export class SubstituteTeacherDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slotId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalTeacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  substituteTeacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodId?: string;
}

export class TimetableEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ enum: TimetableEventTypeEnum })
  @IsOptional()
  @IsEnum(TimetableEventTypeEnum)
  type?: TimetableEventTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}
