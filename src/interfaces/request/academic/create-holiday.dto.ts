import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ example: 'Diwali break', description: 'Holiday title' })
  title: string;

  @ApiProperty({
    example: '2026-07-20',
    description: 'Start date (YYYY-MM-DD)',
  })
  fromDate: string;

  @ApiProperty({ example: '2026-07-20', description: 'End date (YYYY-MM-DD)' })
  toDate: string;

  @ApiPropertyOptional({
    example: 'School remains closed for Diwali',
    description: 'Description',
  })
  description?: string;

  @ApiPropertyOptional({ example: '1', description: 'Academic Session ID' })
  academicSessionId?: string;
}
