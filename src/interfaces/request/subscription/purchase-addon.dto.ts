import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddonTypeEnum } from '../../../models/enums/enums';

export class PurchaseAddonDto {
  @ApiProperty({
    enum: AddonTypeEnum,
    example: AddonTypeEnum.STUDENT_BOOSTER_SMALL,
    description: 'Capacity booster package type',
  })
  @IsNotEmpty()
  @IsEnum(AddonTypeEnum)
  addonType: AddonTypeEnum;
}
