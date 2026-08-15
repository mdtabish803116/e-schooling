// ======================================================
// src/api/rest/v1/lookups/lookups.controller.ts
// Generic Lookup Values REST API
// GET /lookups/:category — list by category (frontend uses this)
// GET /lookups            — list all (paginated, with filters)
// POST /lookups           — create custom lookup
// PATCH /lookups/:id      — update
// DELETE /lookups/:id     — soft-delete
// ======================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  LookupsService,
  LookupValueDto,
} from '../../../../services/lookups/lookups.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('Lookups')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  /* ─────────────────────────────────────────────────────
   * GET /lookups
   * List all lookup values, optionally filtered
   * ───────────────────────────────────────────────────── */
  @ApiOperation({ summary: 'List all lookup values with optional filters' })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @Get()
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{
    data: (LookupValueDto | null)[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return await this.lookupsService.findAll({ schoolId, category, isActive });
  }

  /* ─────────────────────────────────────────────────────
   * GET /lookups/categories
   * Returns list of all distinct category names
   * ───────────────────────────────────────────────────── */
  @ApiOperation({ summary: 'Get all lookup category names' })
  @Get('categories')
  async getCategories(@Query('schoolId') schoolId?: string): Promise<string[]> {
    return await this.lookupsService.getCategories(schoolId);
  }

  /* ─────────────────────────────────────────────────────
   * GET /lookups/:category
   * The primary endpoint the frontend uses:
   *   GET /lookups/PERIOD_TYPE?schoolId=5&isActive=true
   * ───────────────────────────────────────────────────── */
  @ApiOperation({ summary: 'Get all lookup values for a specific category' })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'academicSessionId', required: false })
  @Get(':category')
  async findByCategory(
    @Param('category') category: string,
    @Query('schoolId') schoolId?: string,
    @Query('isActive') isActive?: string,
  ): Promise<(LookupValueDto | null)[]> {
    return await this.lookupsService.findByCategory(category, {
      schoolId,
      isActive,
    });
  }

  /* ─────────────────────────────────────────────────────
   * POST /lookups
   * Create a new custom lookup value (school-specific)
   * ───────────────────────────────────────────────────── */
  @ApiOperation({ summary: 'Create a new lookup value' })
  @Post()
  async create(
    @Body() body: Record<string, unknown>,
  ): Promise<LookupValueDto | null> {
    return await this.lookupsService.create(body);
  }

  /* ─────────────────────────────────────────────────────
   * PATCH /lookups/:id
   * Update an existing lookup value
   * ───────────────────────────────────────────────────── */
  @ApiOperation({ summary: 'Update a lookup value by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<LookupValueDto | null | { message: string }> {
    return await this.lookupsService.update(id, body);
  }

  /* ─────────────────────────────────────────────────────
   * DELETE /lookups/:id
   * Soft-delete a lookup value
   * ───────────────────────────────────────────────────── */
  @ApiOperation({ summary: 'Soft-delete a lookup value' })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.lookupsService.softDelete(id);
  }
}
