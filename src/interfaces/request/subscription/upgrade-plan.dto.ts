import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanCodeEnum, BillingCycleEnum } from '../../../models/enums/enums';

export class UpgradePlanDto {
  @ApiProperty({
    enum: [PlanCodeEnum.BASIC, PlanCodeEnum.STANDARD, PlanCodeEnum.PREMIUM],
    example: PlanCodeEnum.BASIC,
    description: 'Target plan code to upgrade to',
  })
  @IsNotEmpty()
  @IsEnum([PlanCodeEnum.BASIC, PlanCodeEnum.STANDARD, PlanCodeEnum.PREMIUM])
  planCode: PlanCodeEnum;

  @ApiProperty({
    enum: BillingCycleEnum,
    example: BillingCycleEnum.MONTHLY,
    description: 'Preferred billing frequency tier',
  })
  @IsNotEmpty()
  @IsEnum(BillingCycleEnum)
  billingCycle: BillingCycleEnum;
}
