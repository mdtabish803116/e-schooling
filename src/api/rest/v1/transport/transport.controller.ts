import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransportService } from '../../../../services/transport/transport.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/guards/permission.guard';
import { Permission } from '../../../../shared/decorators/permission.decorator';
import { ResourceEnum, ActionEnum } from '../../../../models/enums/enums';
import {
  SaveVehicleDto,
  SaveRouteDto,
  SaveStopDto,
  SaveDriverDto,
  AllocateStudentDto,
} from '../../../../interfaces/request/transport/transport-dto';

@ApiTags('Transport')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('schools/:schoolId/transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // Vehicles
  @Get('vehicles')
  @ApiOperation({ summary: 'Get all transport vehicles for a school' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.VIEW)
  async getVehicles(@Param('schoolId') schoolId: string) {
    return this.transportService.getVehicles(schoolId);
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Create a new transport vehicle' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.CREATE)
  async createVehicle(
    @Param('schoolId') schoolId: string,
    @Body() payload: SaveVehicleDto,
  ) {
    return this.transportService.saveVehicle(schoolId, payload);
  }

  @Put('vehicles/:id')
  @ApiOperation({ summary: 'Update an existing transport vehicle' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.UPDATE)
  async updateVehicle(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() payload: SaveVehicleDto,
  ) {
    return this.transportService.saveVehicle(schoolId, payload, id);
  }

  @Delete('vehicles/:id')
  @ApiOperation({ summary: 'Delete a transport vehicle' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.DELETE)
  async deleteVehicle(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.transportService.deleteVehicle(schoolId, id);
  }

  // Routes
  @Get('routes')
  @ApiOperation({ summary: 'Get all transport routes for a school' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.VIEW)
  async getRoutes(@Param('schoolId') schoolId: string) {
    return this.transportService.getRoutes(schoolId);
  }

  @Post('routes')
  @ApiOperation({ summary: 'Create a new transport route' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.CREATE)
  async createRoute(
    @Param('schoolId') schoolId: string,
    @Body() payload: SaveRouteDto,
  ) {
    return this.transportService.saveRoute(schoolId, payload);
  }

  @Put('routes/:id')
  @ApiOperation({ summary: 'Update an existing transport route' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.UPDATE)
  async updateRoute(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() payload: SaveRouteDto,
  ) {
    return this.transportService.saveRoute(schoolId, payload, id);
  }

  @Delete('routes/:id')
  @ApiOperation({ summary: 'Delete a transport route' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.DELETE)
  async deleteRoute(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.transportService.deleteRoute(schoolId, id);
  }

  @Post('routes/:routeId/stops')
  @ApiOperation({ summary: 'Add a pickup stop to a route' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.CREATE)
  async saveStop(
    @Param('schoolId') schoolId: string,
    @Param('routeId') routeId: string,
    @Body() payload: SaveStopDto,
  ) {
    return this.transportService.saveStop(routeId, payload);
  }

  // Drivers
  @Get('drivers')
  @ApiOperation({ summary: 'Get all transport drivers for a school' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.VIEW)
  async getDrivers(@Param('schoolId') schoolId: string) {
    return this.transportService.getDrivers(schoolId);
  }

  @Post('drivers')
  @ApiOperation({ summary: 'Create a new transport driver' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.CREATE)
  async createDriver(
    @Param('schoolId') schoolId: string,
    @Body() payload: SaveDriverDto,
  ) {
    return this.transportService.saveDriver(schoolId, payload);
  }

  @Put('drivers/:id')
  @ApiOperation({ summary: 'Update an existing transport driver' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.UPDATE)
  async updateDriver(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() payload: SaveDriverDto,
  ) {
    return this.transportService.saveDriver(schoolId, payload, id);
  }

  @Delete('drivers/:id')
  @ApiOperation({ summary: 'Delete a transport driver' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.DELETE)
  async deleteDriver(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.transportService.deleteDriver(schoolId, id);
  }

  // Allocations
  @Get('allocations')
  @ApiOperation({
    summary: 'Get all student transport allocations for a school',
  })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.VIEW)
  async getAllocations(@Param('schoolId') schoolId: string) {
    return this.transportService.getAllocations(schoolId);
  }

  @Post('allocations')
  @ApiOperation({ summary: 'Allocate a student to a transport route' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.CREATE)
  async allocateStudent(
    @Param('schoolId') schoolId: string,
    @Body() payload: AllocateStudentDto,
  ) {
    return this.transportService.allocateStudent(schoolId, payload);
  }

  @Delete('allocations/:id')
  @ApiOperation({ summary: 'Remove a student transport allocation' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.DELETE)
  async removeAllocation(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.transportService.removeAllocation(schoolId, id);
  }

  // Vehicle Assignments
  @Get('assignments')
  @ApiOperation({
    summary: 'Get all vehicle-driver assignment history logs for a school',
  })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.VIEW)
  async getVehicleAssignments(@Param('schoolId') schoolId: string) {
    return this.transportService.getVehicleAssignments(schoolId);
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Assign a fleet vehicle to a driver' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.CREATE)
  async assignVehicleToDriver(
    @Param('schoolId') schoolId: string,
    @Body() payload: { vehicleId: string; driverId: string; notes?: string },
  ) {
    return this.transportService.assignVehicleToDriver(schoolId, payload);
  }

  @Put('assignments/:id/release')
  @ApiOperation({ summary: 'Release a vehicle-driver assignment' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.UPDATE)
  async releaseVehicleAssignment(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.transportService.releaseVehicleAssignment(schoolId, id);
  }

  // Metrics
  @Get('metrics')
  @ApiOperation({ summary: 'Get transport metrics & summary for a school' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.VIEW)
  async getMetrics(@Param('schoolId') schoolId: string) {
    return this.transportService.getMetrics(schoolId);
  }

  // Transport Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get transport settings for a school' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.VIEW)
  async getSettings(@Param('schoolId') schoolId: string) {
    return this.transportService.getSettings(schoolId);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update transport settings for a school' })
  @Permission(ResourceEnum.TRANSPORT, ActionEnum.UPDATE)
  async updateSettings(
    @Param('schoolId') schoolId: string,
    @Body() payload: any,
  ) {
    return this.transportService.updateSettings(schoolId, payload);
  }
}
