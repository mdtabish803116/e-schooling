import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { SidebarService } from '../../../../services/system/sidebar.service';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('System')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly sidebarService: SidebarService) {}

  @ApiOperation({ summary: 'Get dynamic sidebar menu based on entitlements and permissions' })
  @Get('sidebar')
  async getSidebar(
    @CurrentUser() user: AuthContext,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.sidebarService.getDynamicSidebar(user, schoolId);
  }
}
