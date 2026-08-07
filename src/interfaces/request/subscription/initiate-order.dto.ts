import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { BillingCycleEnum, AddonTypeEnum } from '../../../models/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateOrderDto {
  @ApiProperty({ example: '1', description: 'Target School ID' })
  @IsNotEmpty()
  @IsString()
  schoolId: string;

  @ApiProperty({ example: '2', description: 'Optional: Subscription Plan ID' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({
    enum: BillingCycleEnum,
    example: BillingCycleEnum.MONTHLY,
    description: 'Required if planId is provided',
  })
  @IsOptional()
  @IsEnum(BillingCycleEnum)
  billingCycle?: BillingCycleEnum;

  @ApiProperty({
    enum: AddonTypeEnum,
    example: AddonTypeEnum.STUDENT_BOOSTER_MEDIUM,
    description: 'Optional: Addon/Booster type (Capacity)',
  })
  @IsOptional()
  @IsEnum(AddonTypeEnum)
  addonType?: AddonTypeEnum;

  @ApiProperty({
    example: '5',
    description: 'Optional: Specific Feature ID for a-la-carte subscription',
  })
  @IsOptional()
  @IsString()
  featureId?: string;

  @ApiProperty({
    enum: BillingCycleEnum,
    example: BillingCycleEnum.MONTHLY,
    description: 'Billing cycle for the specific feature',
  })
  @IsOptional()
  @IsEnum(BillingCycleEnum)
  featureBillingCycle?: BillingCycleEnum;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;
}
