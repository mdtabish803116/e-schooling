import { Controller, Get, Post, Body, Query, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('School — Entitlements')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/entitlements')
export class EntitlementController {
  constructor(private readonly entitlementService: EntitlementService) {}

  @ApiOperation({ summary: 'Check if a specific feature is allowed for this school' })
  @ApiQuery({ name: 'featureCode', example: 'WHATSAPP_REMINDERS' })
  @Get('check')
  async checkAccess(
    @Param('schoolId') schoolId: string,
    @Query('featureCode') featureCode: string
  ) {
    return this.entitlementService.evaluateFeatureAccess(schoolId, featureCode);
  }

  @ApiOperation({ summary: 'Send and track a Whatsapp reminder message (metered limit check)' })
  @Post('whatsapp/send')
  async sendWhatsappReminder(
    @Param('schoolId') schoolId: string,
    @Body() dto: { message: string; recipient: string }
  ) {
    const check = await this.entitlementService.evaluateFeatureAccess(schoolId, 'WHATSAPP_REMINDERS');
    if (!check.isAllowed) {
      throw new BadRequestException(
        `WhatsApp Reminder limit exceeded: ${check.reason}. ${
          check.quotas ? `Consumed: ${check.quotas.consumedUnits}/${check.quotas.limitCeiling}` : ''
        }`
      );
    }

    // Increments and logs WhatsApp usage telemetry (1 message)
    await this.entitlementService.logUsageEvent(schoolId, 'WHATSAPP_REMINDERS', 1, {
      recipient: dto.recipient,
      messageSnippet: dto.message.slice(0, 50),
    });

    return {
      success: true,
      message: 'WhatsApp reminder sent and usage logged successfully.',
      remainingUnits: check.quotas?.remainingUnits !== null && check.quotas?.remainingUnits !== undefined 
        ? check.quotas.remainingUnits - 1 
        : 'unlimited'
    };
  }
}
