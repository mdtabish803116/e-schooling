import { IsOptional, IsString } from 'class-validator';

export class SchoolAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  academicSessionId?: string;
}
