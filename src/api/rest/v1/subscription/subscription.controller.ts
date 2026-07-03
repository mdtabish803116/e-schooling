import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SubscriptionsService } from '../../../../services/subscription/subscription.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';
import { InitiateOrderDto, VerifyPaymentDto } from '../../../../interfaces/request/subscription/initiate-order.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({ summary: 'List all available subscription plans with prices and features' })
  @Get('plans')
  async listPlans(
    @CurrentUser() caller: AuthContext,
    @Query('schoolId') schoolId: string
  ) {
    return this.subscriptionsService.listAvailablePlans(caller, schoolId);
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

  @ApiOperation({ summary: 'Verify payment and activate subscription' })
  @Post('order/verify')
  async verifyPayment(
    @CurrentUser() caller: AuthContext,
    @Body() dto: VerifyPaymentDto
  ) {
    return this.subscriptionsService.verifyPayment(caller, dto);
  }

  @ApiOperation({ summary: 'Get billing history (orders & payments)' })
  @Permission(ResourceEnum.FINANCE_ORDER, ActionEnum.VIEW)
  @Get(':schoolId/history')
  async getBillingHistory(
    @Param('schoolId') schoolId: string
  ) {
    return this.subscriptionsService.getBillingHistory(schoolId);
  }

  @ApiOperation({ summary: 'Get all invoices for a school' })
  @Permission(ResourceEnum.FINANCE_INVOICE, ActionEnum.VIEW)
  @Get(':schoolId/invoices')
  async listInvoices(
    @Param('schoolId') schoolId: string,
  ) {
    return this.subscriptionsService.listInvoices(schoolId);
  }

  @ApiOperation({ summary: 'Get real-time subscription usage and limits' })
  @Permission(ResourceEnum.SUBSCRIPTION, ActionEnum.VIEW)
  @Get(':schoolId/usage')
  async getUsageStats(
    @Param('schoolId') schoolId: string,
  ) {
    return this.subscriptionsService.getUsageStats(schoolId);
  }

  @ApiOperation({ summary: 'Get active plan, features, and boosters with remaining days and status' })
  @Get(':schoolId/active-items-status')
  async getActiveItemsStatus(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
  ) {
    return this.subscriptionsService.getActiveItemsStatus(caller, schoolId);
  }

  @ApiOperation({ summary: 'Update the activation strategy of a queued subscription plan' })
  @Patch(':schoolId/queued-strategy')
  async updateQueuedStrategy(
    @CurrentUser() caller: AuthContext,
    @Param('schoolId') schoolId: string,
    @Body('strategy') strategy: 'immediate' | 'parallel',
  ) {
    return this.subscriptionsService.updateQueuedActivationStrategy(caller, schoolId, strategy);
  }
}
