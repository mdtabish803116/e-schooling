import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { GeoService } from '../../../../services/geo/geo.service';
import { CreatePlaceDto } from '../../../../interfaces/request/geo/create-place.dto';

@ApiTags('Geographic & Locality System')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @ApiOperation({ summary: 'Fetch all active globally available States/Provinces' })
  @Get('states')
  async getStates() {
    return this.geoService.listStates();
  }

  @ApiOperation({ summary: 'Fetch all active regional Districts belonging to a target State context' })
  @Get('states/:stateId/districts')
  async getDistricts(@Param('stateId') stateId: string) {
    return this.geoService.listDistricts(stateId);
  }

  @ApiOperation({ summary: 'List all custom tenant branch locations, villages, and cluster parameters' })
  @ApiQuery({ name: 'districtId', required: false, description: 'Filter by specific parent District ID' })
  @Get('schools/:schoolId/places')
  async getPlaces(
    @Param('schoolId') schoolId: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.geoService.listPlaces(schoolId, districtId);
  }

  @ApiOperation({ summary: 'Create customized villages, local blocks, or city centers exclusively bound to the target branch record' })
  @Post('schools/:schoolId/places')
  async createPlace(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreatePlaceDto,
  ) {
    return this.geoService.createPlace(schoolId, dto);
  }
}
