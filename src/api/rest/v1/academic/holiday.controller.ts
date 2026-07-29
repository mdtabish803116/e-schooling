import { Controller, Post, Get, Patch, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { FeatureGuard } from '../../../../shared/guards/feature.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Feature } from '../../../../shared/decorators/feature.decorator';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';
import { HolidayService } from '../../../../services/academic/holiday.service';
import { CreateHolidayDto } from '../../../../interfaces/request/academic/create-holiday.dto';
import { UpdateHolidayDto } from '../../../../interfaces/request/academic/update-holiday.dto';

@ApiTags('Holidays & Calendar')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureGuard, PermissionGuard)
@Feature('ATTENDANCE_MANAGEMENT')
@Controller('schools/:schoolId/holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @ApiOperation({ summary: 'Get all school holidays' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.VIEW)
  @Get()
  async getHolidays(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.holidayService.getHolidays(user, schoolId);
  }

  @ApiOperation({ summary: 'Create a new school holiday' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.CREATE)
  @Post()
  async createHoliday(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: CreateHolidayDto,
  ) {
    return this.holidayService.createHoliday(user, schoolId, dto);
  }

  @ApiOperation({ summary: 'Update a school holiday' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.UPDATE)
  @Patch(':holidayId')
  async updateHoliday(
    @Param('schoolId') schoolId: string,
    @Param('holidayId') holidayId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.holidayService.updateHoliday(user, schoolId, holidayId, dto);
  }

  @ApiOperation({ summary: 'Update a school holiday (PUT)' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.UPDATE)
  @Put(':holidayId')
  async updateHolidayPut(
    @Param('schoolId') schoolId: string,
    @Param('holidayId') holidayId: string,
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.holidayService.updateHoliday(user, schoolId, holidayId, dto);
  }

  @ApiOperation({ summary: 'Delete a school holiday' })
  @Permission(ResourceEnum.ATTENDANCE, ActionEnum.DELETE)
  @Delete(':holidayId')
  async deleteHoliday(
    @Param('schoolId') schoolId: string,
    @Param('holidayId') holidayId: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.holidayService.deleteHoliday(user, schoolId, holidayId);
  }
}
