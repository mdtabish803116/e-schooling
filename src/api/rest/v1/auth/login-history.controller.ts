import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../../../../services/auth/auth.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';

@ApiTags('Login History & Audit')
@Controller('auth/login-history')
export class LoginHistoryController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Get paginated login history with filters' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get()
  async getLoginHistory(
    @Query('schoolId') schoolId?: string,
    @Query('userId') userId?: string,
    @Query('role') role?: string,
    @Query('loginStatus') loginStatus?: string,
    @Query('authAction') authAction?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.authService.getLoginHistory({
      schoolId,
      userId,
      role,
      loginStatus,
      authAction,
      search,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @ApiOperation({ summary: 'Get active sessions' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('active-sessions')
  async getActiveSessions(
    @Query('schoolId') schoolId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.authService.getActiveSessions(schoolId, userId);
  }

  @ApiOperation({ summary: 'Revoke/terminate an active user session' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('revoke/:id')
  async revokeSession(@Param('id') id: string, @CurrentUser() caller: any) {
    return this.authService.revokeSession(id, caller?.id);
  }

  @ApiOperation({ summary: 'Log out current session' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() caller: any,
    @Body('sessionId') sessionId?: string,
  ) {
    return this.authService.logout(caller?.id, sessionId);
  }

  @ApiOperation({ summary: 'Get login analytics and metrics' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  async getLoginAnalytics(@Query('schoolId') schoolId?: string) {
    return this.authService.getLoginAnalytics(schoolId);
  }

  @ApiOperation({ summary: 'Purge login records older than retention period' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('purge')
  async purgeLoginHistory(@Body('daysToKeep') daysToKeep: number) {
    return this.authService.purgeLoginHistory(daysToKeep || 365);
  }
}
