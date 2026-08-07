import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { DocumentMasterService } from '../../../../services/document/document-master.service';
import { CreateDocumentMasterDto } from '../../../../interfaces/request/document/create-document-master.dto';
import { UpdateDocumentMasterDto } from '../../../../interfaces/request/document/update-document-master.dto';
import { BulkUpdateDocumentMasterDto } from '../../../../interfaces/request/document/bulk-update-document-master.dto';
import { UploadEntityDocumentDto } from '../../../../interfaces/request/document/upload-entity-document.dto';
import { VerifyEntityDocumentDto } from '../../../../interfaces/request/document/verify-entity-document.dto';
import type { AuthContext } from '../../../../interfaces/auth-context.interface';

@ApiTags('Document Master')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentMasterController {
  constructor(private readonly documentMasterService: DocumentMasterService) {}

  private resolveSchoolId(
    req: any,
    user: AuthContext,
    paramSchoolId?: string,
  ): string {
    if (
      paramSchoolId &&
      paramSchoolId !== 'undefined' &&
      paramSchoolId !== 'null'
    ) {
      return paramSchoolId;
    }
    const headerSchoolId = req?.headers?.['x-school-id'];
    if (
      headerSchoolId &&
      headerSchoolId !== 'undefined' &&
      headerSchoolId !== 'null'
    ) {
      return String(headerSchoolId);
    }
    if (user?.schoolId) {
      return String(user.schoolId);
    }
    return '1';
  }

  /* ─────────────────── DROPDOWN ─── */

  @ApiOperation({
    summary: 'Get lightweight dropdown of active document masters',
  })
  @Get('schools/:schoolId/document-masters/dropdown')
  async getDropdown(
    @Param('schoolId') schoolIdParam: string,
    @Query('moduleCode') moduleCode: string,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.getDocumentMasterDropdown(
      schoolId,
      moduleCode,
    );
  }

  /* ─────────────────── BULK ─── */

  @ApiOperation({ summary: 'Bulk update document masters' })
  @Patch('schools/:schoolId/document-masters/bulk')
  async bulkUpdate(
    @Param('schoolId') schoolIdParam: string,
    @Body() dto: BulkUpdateDocumentMasterDto,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.bulkUpdateDocumentMasters(
      schoolId,
      dto,
      user?.id,
    );
  }

  /* ─────────────────── LIST ─── */

  @ApiOperation({ summary: 'List document masters for a school' })
  @Get('schools/:schoolId/document-masters')
  async getList(
    @Param('schoolId') schoolIdParam: string,
    @Query() query: any,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.getDocumentMasters(schoolId, query);
  }

  /* ─────────────────── CREATE ─── */

  @ApiOperation({ summary: 'Create a new document master' })
  @Post('schools/:schoolId/document-masters')
  async create(
    @Param('schoolId') schoolIdParam: string,
    @Body() dto: CreateDocumentMasterDto,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.createDocumentMaster(
      schoolId,
      dto,
      user?.id,
    );
  }

  /* ─────────────────── GET BY ID ─── */

  @ApiOperation({ summary: 'Get document master by ID' })
  @Get('schools/:schoolId/document-masters/:id')
  async getById(
    @Param('schoolId') schoolIdParam: string,
    @Param('id') id: string,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.getDocumentMasterById(schoolId, id);
  }

  /* ─────────────────── UPDATE ─── */

  @ApiOperation({ summary: 'Update a document master' })
  @Patch('schools/:schoolId/document-masters/:id')
  async update(
    @Param('schoolId') schoolIdParam: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentMasterDto,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.updateDocumentMaster(
      schoolId,
      id,
      dto,
      user?.id,
    );
  }

  /* ─────────────────── DELETE (SOFT) ─── */

  @ApiOperation({ summary: 'Soft delete a document master' })
  @Delete('schools/:schoolId/document-masters/:id')
  async delete(
    @Param('schoolId') schoolIdParam: string,
    @Param('id') id: string,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    await this.documentMasterService.deleteDocumentMaster(
      schoolId,
      id,
      user?.id,
    );
    return { success: true, message: 'Document master archived' };
  }

  /* ─────────────────── RESTORE ─── */

  @ApiOperation({ summary: 'Restore a soft deleted document master' })
  @Post('schools/:schoolId/document-masters/:id/restore')
  async restore(
    @Param('schoolId') schoolIdParam: string,
    @Param('id') id: string,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.restoreDocumentMaster(
      schoolId,
      id,
      user?.id,
    );
  }

  /* ─────────────────── ENTITY DOCUMENTS ─── */

  @ApiOperation({ summary: 'Get uploaded documents for an entity' })
  @Get('schools/:schoolId/entity-documents')
  async getEntityDocuments(
    @Param('schoolId') schoolIdParam: string,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.getEntityDocuments(
      schoolId,
      entityType,
      entityId,
    );
  }

  @ApiOperation({ summary: 'Upload an entity document' })
  @Post('schools/:schoolId/entity-documents')
  async uploadEntityDocument(
    @Param('schoolId') schoolIdParam: string,
    @Body() dto: UploadEntityDocumentDto,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.uploadEntityDocument(
      schoolId,
      dto,
      user?.id,
    );
  }

  @ApiOperation({ summary: 'Verify or reject an entity document' })
  @Patch('schools/:schoolId/entity-documents/:id/verify')
  async verifyEntityDocument(
    @Param('schoolId') schoolIdParam: string,
    @Param('id') id: string,
    @Body() dto: VerifyEntityDocumentDto,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    return this.documentMasterService.verifyEntityDocument(
      schoolId,
      id,
      dto,
      user?.id,
    );
  }

  @ApiOperation({ summary: 'Delete an entity document' })
  @Delete('schools/:schoolId/entity-documents/:id')
  async deleteEntityDocument(
    @Param('schoolId') schoolIdParam: string,
    @Param('id') id: string,
    @Req() req: any,
    @CurrentUser() user: AuthContext,
  ) {
    const schoolId = this.resolveSchoolId(req, user, schoolIdParam);
    await this.documentMasterService.deleteEntityDocument(
      schoolId,
      id,
      user?.id,
    );
    return { success: true, message: 'Entity document deleted' };
  }
}
