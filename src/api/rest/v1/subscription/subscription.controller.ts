import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SubscriptionsService } from '../../../../services/subscription/subscription.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { BillingCycleEnum } from '../../../../models/enums/enums';
import { InitiateOrderDto, VerifyPaymentDto } from '../../../../interfaces/request/subscription/initiate-order.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({ summary: 'List all available subscription plans with prices and features' })
  @Get('plans')
  async listPlans() {
    return this.subscriptionsService.listAvailablePlans();
  }

  @ApiOperation({ summary: 'Get current subscription snapshot for a school' })
  @Get(':schoolId/summary')
  async getSummary(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string
  ) {
    return this.subscriptionsService.getSubscriptionSummary(caller, schoolId);
  }

  @ApiOperation({ summary: 'Step 1: Initiate a paid or trial order (Plan, Feature, or Booster)' })
  @Post('order/initiate')
  async initiateOrder(
    @CurrentUser() caller: AuthContext,
    @Body() dto: InitiateOrderDto
  ) {
    return this.subscriptionsService.initiateOrder(caller, dto);
  }

  @ApiOperation({ summary: 'Step 2: Verify payment and fulfill order' })
  @Post('order/verify')
  async verifyPayment(
    @CurrentUser() caller: AuthContext,
    @Body() dto: VerifyPaymentDto
  ) {
    return this.subscriptionsService.verifyPayment(caller, dto);
  }
}
