import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiPropertyOptional()
  schoolId?: string;

  @ApiPropertyOptional()
  academicSessionId?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  priority?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  requireAcknowledgement?: boolean;

  @ApiPropertyOptional()
  deliveryChannels?: string[];

  @ApiPropertyOptional()
  publishAt?: string;

  @ApiPropertyOptional()
  expiresAt?: string;

  @ApiPropertyOptional()
  targets?: any[];

  @ApiPropertyOptional()
  attachments?: any[];
}
