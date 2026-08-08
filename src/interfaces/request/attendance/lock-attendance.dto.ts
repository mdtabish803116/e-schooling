import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LockAttendanceDto {
  @ApiProperty({
    example: '2026-07-21',
    description: 'Attendance date to lock (YYYY-MM-DD)',
  })
  date: string;

  @ApiPropertyOptional({
    example: 'Principal Admin',
    description: 'Person locking the date',
  })
  lockedBy?: string;
}

export class UnlockAttendanceDto {
  @ApiProperty({
    example: '2026-07-21',
    description: 'Attendance date to unlock (YYYY-MM-DD)',
  })
  date: string;
}
