import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';
import { LogUsageDto } from '../../../../interfaces/request/entitlement/log-usage.dto';

@ApiTags('Feature Entitlements & Metered Add-ons')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('entitlements')
export class EntitlementController {
  constructor(private readonly entitlementService: EntitlementService) {}

  @ApiOperation({ summary: 'Evaluate multi-tenant access clearance, overrides, and consumption boundaries for a target capability' })
  @Get(':schoolId/evaluate/:featureCode')
  async evaluateAccess(
    @Param('schoolId') schoolId: string,
    @Param('featureCode') featureCode: string,
  ) {
    return this.entitlementService.evaluateFeatureAccess(schoolId, featureCode);
  }

  @ApiOperation({ summary: 'Chronologically report execution events to the resource consumption telemetry engine' })
  @Post(':schoolId/log-usage')
  async logUsage(
    @Param('schoolId') schoolId: string,
    @Body() dto: LogUsageDto,
  ) {
    return this.entitlementService.logUsageEvent(
      schoolId,
      dto.featureCode,
      dto.unitsConsumed,
      dto.metadata,
    );
  }
}
