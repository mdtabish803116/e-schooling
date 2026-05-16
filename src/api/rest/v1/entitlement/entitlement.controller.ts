import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
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
  @ApiQuery({ name: 'featureCode', example: 'WHATSAPP' })
  @Get('check')
  async checkAccess(
    @Param('schoolId') schoolId: string,
    @Query('featureCode') featureCode: string
  ) {
    return this.entitlementService.evaluateFeatureAccess(schoolId, featureCode);
  }
}
