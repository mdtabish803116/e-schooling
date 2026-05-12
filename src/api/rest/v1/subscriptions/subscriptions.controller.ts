import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SubscriptionsService } from '../../../../services/subscriptions/subscriptions.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { UpgradePlanDto } from '../../../../interfaces/request/subscription/upgrade-plan.dto';
import { PurchaseAddonDto } from '../../../../interfaces/request/subscription/purchase-addon.dto';

@ApiTags('Subscriptions & Booster Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({ summary: 'View active subscription summary, caps, and current active dynamic boosters' })
  @Get(':schoolId/summary')
  async getSubscriptionSummary(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
  ) {
    return this.subscriptionsService.getSubscriptionSummary(caller, schoolId);
  }

  @ApiOperation({ summary: 'Upgrade base subscription tier and billing cycle frequency' })
  @Post(':schoolId/upgrade')
  async upgradePlan(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() dto: UpgradePlanDto,
  ) {
    return this.subscriptionsService.upgradePlan(caller, schoolId, dto);
  }

  @ApiOperation({ summary: 'Purchase standalone 1-month Student Quota Booster pack' })
  @Post(':schoolId/addons')
  async purchaseAddon(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body() dto: PurchaseAddonDto,
  ) {
    return this.subscriptionsService.purchaseAddon(caller, schoolId, dto);
  }
}
