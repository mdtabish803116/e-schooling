import { IsNotEmpty, IsString, IsInt, Min, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogUsageDto {
  @ApiProperty({
    example: 'WHATSAPP_MESSAGING',
    description: 'Target identification code of the metered capability',
  })
  @IsNotEmpty()
  @IsString()
  featureCode: string;

  @ApiProperty({
    example: 5,
    description: 'Quantity increment consumed during execution event',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  unitsConsumed: number;

  @ApiPropertyOptional({
    example: { targetPhone: '+919876543210', statusReceived: 'delivered' },
    description: 'Extensible metadata telemetry context payload',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
