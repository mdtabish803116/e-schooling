import { IsOptional, IsString, IsBoolean, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubjectDto {
  @ApiPropertyOptional({
    example: 'Mathematics',
    description: 'Updated name of the subject',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Subject name must be between 2 and 100 characters' })
  @Matches(/^[a-zA-Z0-9\s.,'()&/-]+$/, {
    message:
      'Subject name can only contain letters, numbers, spaces and common punctuation (.,\'()&/-)',
  })
  name?: string;

  @ApiPropertyOptional({ example: true, description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
