import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class LockAttendanceDto {
  @ApiProperty({
    example: '2026-07-21',
    description: 'Attendance date to lock (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString(
    {},
    { message: 'Please enter a valid date (YYYY-MM-DD)' },
  )
  date: string;

  @ApiPropertyOptional({
    example: 'Principal Admin',
    description: 'Person locking the date',
  })
  @IsOptional()
  @IsString({ message: 'Locked by must be a string' })
  @MaxLength(100, { message: 'Locked by cannot exceed 100 characters' })
  lockedBy?: string;
}

export class UnlockAttendanceDto {
  @ApiProperty({
    example: '2026-07-21',
    description: 'Attendance date to unlock (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString(
    {},
    { message: 'Please enter a valid date (YYYY-MM-DD)' },
  )
  date: string;
}
