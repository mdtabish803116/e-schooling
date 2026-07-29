import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DocumentMaster } from '../../models/entities/document/document-master.entity';
import { EntityDocument } from '../../models/entities/document/entity-document.entity';
import { CreateDocumentMasterDto } from '../../interfaces/request/document/create-document-master.dto';
import { UpdateDocumentMasterDto } from '../../interfaces/request/document/update-document-master.dto';
import { BulkUpdateDocumentMasterDto } from '../../interfaces/request/document/bulk-update-document-master.dto';
import { UploadEntityDocumentDto } from '../../interfaces/request/document/upload-entity-document.dto';
import { VerifyEntityDocumentDto } from '../../interfaces/request/document/verify-entity-document.dto';

@Injectable()
export class DocumentMasterService {
  private masterRepo: Repository<DocumentMaster>;
  private entityDocRepo: Repository<EntityDocument>;

  constructor(private dataSource: DataSource) {
    this.masterRepo = this.dataSource.getRepository(DocumentMaster);
    this.entityDocRepo = this.dataSource.getRepository(EntityDocument);
  }

  /* ─────────────────── Helper ─── */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* ─────────────────── Document Master CRUD ─── */

  async getDocumentMasters(schoolId: string, query: any) {
    const qb = this.masterRepo
      .createQueryBuilder('dm')
      .where('dm.schoolId = :schoolId', { schoolId });

    if (query?.isDeleted === 'true' || query?.isDeleted === true) {
      qb.andWhere('dm.isDeleted = true');
    } else {
      qb.andWhere('dm.isDeleted = false');
    }

    if (query?.isActive === 'true' || query?.isActive === true) {
      qb.andWhere('dm.isActive = true');
    } else if (query?.isActive === 'false' || query?.isActive === false) {
      qb.andWhere('dm.isActive = false');
    }

    if (query?.category) {
      qb.andWhere('dm.category = :category', { category: query.category });
    }

    if (query?.moduleCode) {
      qb.andWhere(':moduleCode = ANY(dm.applicableModules)', { moduleCode: query.moduleCode });
    }

    if (query?.search) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(dm.name) LIKE :s OR LOWER(dm.code) LIKE :s)', { s });
    }

    const page = parseInt(query?.page, 10) || 1;
    const limit = parseInt(query?.limit, 10) || 50;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('dm.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getDocumentMasterById(schoolId: string, id: string): Promise<DocumentMaster> {
    const doc = await this.masterRepo.findOne({
      where: { id, schoolId },
    });
    if (!doc) {
      throw new NotFoundException(`Document master record with ID ${id} not found`);
    }
    return doc;
  }

  async createDocumentMaster(
    schoolId: string,
    dto: CreateDocumentMasterDto,
    userId?: string,
  ): Promise<DocumentMaster> {
    const code = dto.code ? this.slugify(dto.code) : this.slugify(dto.name);

    const existing = await this.masterRepo.findOne({
      where: { schoolId, code, isDeleted: false },
    });
    if (existing) {
      throw new ConflictException(`Document master with code "${code}" already exists for this school`);
    }

    const doc = this.masterRepo.create({
      schoolId,
      name: dto.name,
      code,
      description: dto.description || null,
      category: dto.category || 'other',
      acceptedFileTypes: dto.acceptedFileTypes || ['pdf', 'jpg', 'png'],
      maxFileSizeMb: dto.maxFileSizeMb || 5,
      isMandatory: dto.isMandatory ?? false,
      applicableModules: dto.applicableModules || [],
      expiryTrackingEnabled: dto.expiryTrackingEnabled ?? false,
      verificationRequired: dto.verificationRequired ?? false,
      isActive: dto.isActive ?? true,
      isDeleted: false,
      createdById: userId || null,
      updatedById: userId || null,
    });

    return this.masterRepo.save(doc);
  }

  async updateDocumentMaster(
    schoolId: string,
    id: string,
    dto: UpdateDocumentMasterDto,
    userId?: string,
  ): Promise<DocumentMaster> {
    const doc = await this.getDocumentMasterById(schoolId, id);

    if (dto.name !== undefined) doc.name = dto.name;
    if (dto.description !== undefined) doc.description = dto.description;
    if (dto.category !== undefined) doc.category = dto.category;
    if (dto.acceptedFileTypes !== undefined) doc.acceptedFileTypes = dto.acceptedFileTypes;
    if (dto.maxFileSizeMb !== undefined) doc.maxFileSizeMb = dto.maxFileSizeMb;
    if (dto.isMandatory !== undefined) doc.isMandatory = dto.isMandatory;
    if (dto.applicableModules !== undefined) doc.applicableModules = dto.applicableModules;
    if (dto.expiryTrackingEnabled !== undefined) doc.expiryTrackingEnabled = dto.expiryTrackingEnabled;
    if (dto.verificationRequired !== undefined) doc.verificationRequired = dto.verificationRequired;
    if (dto.isActive !== undefined) doc.isActive = dto.isActive;
    doc.updatedById = userId || null;

    return this.masterRepo.save(doc);
  }

  async deleteDocumentMaster(schoolId: string, id: string, userId?: string): Promise<void> {
    const doc = await this.getDocumentMasterById(schoolId, id);

    // Reference check
    const refCount = await this.entityDocRepo.count({
      where: { schoolId, documentMasterId: id, isDeleted: false },
    });

    if (refCount > 0) {
      throw new ConflictException(
        `Cannot delete document type "${doc.name}". ${refCount} uploaded document(s) reference it.`,
      );
    }

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    doc.deletedById = userId || null;
    await this.masterRepo.save(doc);
  }

  async restoreDocumentMaster(schoolId: string, id: string, userId?: string): Promise<DocumentMaster> {
    const doc = await this.masterRepo.findOne({ where: { id, schoolId } });
    if (!doc) throw new NotFoundException(`Document master with ID ${id} not found`);

    doc.isDeleted = false;
    doc.deletedAt = null;
    doc.isActive = true;
    doc.updatedById = userId || null;
    return this.masterRepo.save(doc);
  }

  async getDocumentMasterDropdown(schoolId: string, moduleCode?: string) {
    const qb = this.masterRepo
      .createQueryBuilder('dm')
      .where('dm.schoolId = :schoolId', { schoolId })
      .andWhere('dm.isDeleted = false')
      .andWhere('dm.isActive = true');

    if (moduleCode) {
      qb.andWhere('(:moduleCode = ANY(dm.applicableModules) OR cardinality(dm.applicableModules) = 0)', {
        moduleCode,
      });
    }

    qb.orderBy('dm.name', 'ASC');

    const items = await qb.getMany();
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      code: i.code,
      category: i.category,
      isMandatory: i.isMandatory,
      acceptedFileTypes: i.acceptedFileTypes,
      maxFileSizeMb: i.maxFileSizeMb,
      expiryTrackingEnabled: i.expiryTrackingEnabled,
      verificationRequired: i.verificationRequired,
    }));
  }

  async bulkUpdateDocumentMasters(
    schoolId: string,
    dto: BulkUpdateDocumentMasterDto,
    userId?: string,
  ) {
    if (!dto.ids || dto.ids.length === 0) return { updated: 0 };

    const updateFields: any = { ...dto.patch, updatedById: userId || null };
    delete updateFields.id;
    delete updateFields.schoolId;

    const res = await this.masterRepo
      .createQueryBuilder()
      .update(DocumentMaster)
      .set(updateFields)
      .where('schoolId = :schoolId AND id IN (:...ids)', { schoolId, ids: dto.ids })
      .execute();

    return { updated: res.affected || 0 };
  }

  /* ─────────────────── Entity Documents ─────────────────── */

  async getEntityDocuments(schoolId: string, entityType: string, entityId: string) {
    return this.entityDocRepo.find({
      where: { schoolId, entityType, entityId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadEntityDocument(schoolId: string, dto: UploadEntityDocumentDto, userId?: string) {
    const master = await this.masterRepo.findOne({
      where: { id: dto.documentMasterId, schoolId, isDeleted: false },
    });

    if (!master) {
      throw new NotFoundException(`Document master ID ${dto.documentMasterId} not found`);
    }

    const doc = this.entityDocRepo.create({
      schoolId,
      documentMasterId: dto.documentMasterId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName || null,
      fileSizeBytes: dto.fileSizeBytes || null,
      mimeType: dto.mimeType || null,
      expiryDate: dto.expiryDate || null,
      verificationStatus: master.verificationRequired ? 'pending' : 'verified',
      uploadedById: userId || null,
      isDeleted: false,
    });

    return this.entityDocRepo.save(doc);
  }

  async verifyEntityDocument(
    schoolId: string,
    docId: string,
    dto: VerifyEntityDocumentDto,
    userId?: string,
  ) {
    const doc = await this.entityDocRepo.findOne({
      where: { id: docId, schoolId, isDeleted: false },
    });

    if (!doc) throw new NotFoundException(`Entity document ID ${docId} not found`);

    doc.verificationStatus = dto.verificationStatus;
    doc.verifiedById = userId || null;
    doc.verifiedAt = new Date();
    doc.rejectionReason = dto.rejectionReason || null;

    return this.entityDocRepo.save(doc);
  }

  async deleteEntityDocument(schoolId: string, docId: string, userId?: string) {
    const doc = await this.entityDocRepo.findOne({
      where: { id: docId, schoolId, isDeleted: false },
    });

    if (!doc) throw new NotFoundException(`Entity document ID ${docId} not found`);

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await this.entityDocRepo.save(doc);
  }
}
