import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AnnouncementEntity } from '../../models/entities/announcement/announcement.entity';
import { CreateAnnouncementDto } from '../../interfaces/request/announcement/create-announcement.dto';

export interface AnnouncementFiltersQuery {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
}

export interface TargetItem {
  id?: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
}

export interface AttachmentItem {
  id?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt?: string;
}

export interface RecipientSummaryData {
  staffCount: number;
  studentCount: number;
  parentCount: number;
  totalCount: number;
}

export interface AnalyticsData {
  totalRecipients: number;
  deliveredCount: number;
  viewedCount: number;
  acknowledgedCount: number;
  unreadCount: number;
  pendingAcknowledgementCount: number;
  acknowledgementRate: number;
  viewRate: number;
}

@Injectable()
export class AnnouncementsService implements OnModuleInit {
  private readonly repo: Repository<AnnouncementEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(AnnouncementEntity);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."school_announcements" (
          "id" BIGSERIAL NOT NULL,
          "school_id" bigint NOT NULL,
          "academic_session_id" bigint,
          "title" character varying NOT NULL,
          "summary" text,
          "content" text NOT NULL,
          "category" character varying NOT NULL DEFAULT 'GENERAL',
          "priority" character varying NOT NULL DEFAULT 'NORMAL',
          "status" character varying NOT NULL DEFAULT 'PUBLISHED',
          "require_acknowledgement" boolean NOT NULL DEFAULT false,
          "delivery_channels" jsonb DEFAULT '["IN_APP"]',
          "publish_at" TIMESTAMP,
          "published_at" TIMESTAMP,
          "expires_at" TIMESTAMP,
          "targets" jsonb DEFAULT '[]',
          "attachments" jsonb DEFAULT '[]',
          "recipient_summary" jsonb DEFAULT '{}',
          "analytics" jsonb DEFAULT '{}',
          "is_active" boolean NOT NULL DEFAULT true,
          "is_delete" boolean NOT NULL DEFAULT false,
          "created_by_id" bigint,
          "created_by_name" character varying,
          "created_by_role" character varying,
          "updated_by_id" bigint,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_school_announcements_id" PRIMARY KEY ("id")
        );
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_school_announcements_school_id" ON "e_schooling"."school_announcements" ("school_id");
      `);
    } catch (e) {
      console.error('Failed to initialize school_announcements table:', e);
    }
  }

  /**
   * Automatically publish scheduled announcements whose publishAt time has passed
   */
  async autoPublishDueAnnouncements(schoolId?: string): Promise<number> {
    try {
      const qb = this.repo
        .createQueryBuilder('a')
        .where('a.status = :scheduledStatus', { scheduledStatus: 'SCHEDULED' })
        .andWhere('a.publishAt IS NOT NULL AND a.publishAt <= :now', {
          now: new Date(),
        })
        .andWhere('a.isDeleted = false');

      if (schoolId) {
        qb.andWhere('a.schoolId = :schoolId', { schoolId });
      }

      const dueAnnouncements = await qb.getMany();
      if (dueAnnouncements.length === 0) return 0;

      const now = new Date();
      for (const ann of dueAnnouncements) {
        ann.status = 'PUBLISHED';
        ann.publishedAt = now;

        const analytics = (ann.analytics as AnalyticsData) || {};
        const total = analytics.totalRecipients || 0;
        analytics.deliveredCount = total;
        analytics.unreadCount = total;
        ann.analytics = analytics;
      }

      await this.repo.save(dueAnnouncements);
      return dueAnnouncements.length;
    } catch (e) {
      console.error('Error auto-publishing due announcements:', e);
      return 0;
    }
  }

  // 1. Get Announcements list from DB
  async getAnnouncements(schoolId: string, filters?: AnnouncementFiltersQuery) {
    // Auto-publish due scheduled announcements before querying list
    await this.autoPublishDueAnnouncements(schoolId);

    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.schoolId = :schoolId', { schoolId })
      .andWhere('a.isDeleted = false');

    if (filters?.status && filters.status !== 'ALL') {
      qb.andWhere('a.status = :status', { status: filters.status });
    }

    if (filters?.category && filters.category !== 'ALL') {
      qb.andWhere('a.category = :category', { category: filters.category });
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      qb.andWhere('a.priority = :priority', { priority: filters.priority });
    }

    if (filters?.search) {
      qb.andWhere('(LOWER(a.title) LIKE :q OR LOWER(a.summary) LIKE :q)', {
        q: `%${filters.search.toLowerCase()}%`,
      });
    }

    qb.orderBy('a.createdAt', 'DESC');
    const items = await qb.getMany();
    return items.map((item) => this.formatAnnouncement(item));
  }

  // 2. Get Announcement Details by ID from DB
  async getAnnouncementById(schoolId: string, id: string) {
    await this.autoPublishDueAnnouncements(schoolId);

    const item = await this.repo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!item) throw new NotFoundException('Announcement not found');
    return this.formatAnnouncement(item);
  }

  // 3. Create Announcement into DB
  async createAnnouncement(
    schoolId: string,
    dto: CreateAnnouncementDto,
    creatorId?: string,
    creatorName?: string,
    creatorRole?: string,
  ) {
    const rawTargets = dto.targets || dto.targetAudience;
    const targets: TargetItem[] = Array.isArray(rawTargets)
      ? rawTargets.map((t) =>
          typeof t === 'string' ? { targetType: t, targetName: t } : t,
        )
      : [{ targetType: 'EVERYONE', targetName: 'Everyone' }];

    const recipientSummary = this.computeRecipientSummary(targets);
    const totalRecipients = recipientSummary.totalCount || 0;

    let initialStatus =
      dto.status || (dto.publishAt ? 'SCHEDULED' : 'PUBLISHED');
    let publishedAt: Date | null = null;
    const publishAtDate = dto.publishAt ? new Date(dto.publishAt) : null;

    if (initialStatus === 'SCHEDULED' && publishAtDate) {
      if (publishAtDate <= new Date()) {
        initialStatus = 'PUBLISHED';
        publishedAt = new Date();
      }
    } else if (initialStatus === 'PUBLISHED') {
      publishedAt = new Date();
    }

    const analytics: AnalyticsData = {
      totalRecipients,
      deliveredCount: initialStatus === 'PUBLISHED' ? totalRecipients : 0,
      viewedCount: 0,
      acknowledgedCount: 0,
      unreadCount: totalRecipients,
      pendingAcknowledgementCount: dto.requireAcknowledgement
        ? totalRecipients
        : 0,
      acknowledgementRate: 0,
      viewRate: 0,
    };

    const entityData: Partial<AnnouncementEntity> = {
      schoolId,
      academicSessionId: dto.academicSessionId || null,
      title: dto.title,
      summary: dto.summary || '',
      content: dto.content,
      category: dto.category || 'GENERAL',
      priority: dto.priority || 'NORMAL',
      status: initialStatus,
      requireAcknowledgement: dto.requireAcknowledgement ?? false,
      deliveryChannels: dto.deliveryChannels || ['IN_APP'],
      publishAt: publishAtDate,
      publishedAt,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      targets,
      attachments: dto.attachments || [],
      recipientSummary,
      analytics,
      isActive: true,
      isDeleted: false,
      createdById: creatorId || null,
      createdByName: creatorName || 'School Management',
      createdByRole: creatorRole || 'School Admin',
    };

    const entity = this.repo.create(entityData);
    const saved = await this.repo.save(entity);
    return this.formatAnnouncement(saved);
  }

  // 4. Update Announcement in DB
  async updateAnnouncement(
    schoolId: string,
    id: string,
    dto: Partial<CreateAnnouncementDto>,
    updaterId?: string,
  ) {
    const item = await this.repo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!item) throw new NotFoundException('Announcement not found');

    if (dto.title !== undefined) item.title = dto.title;
    if (dto.summary !== undefined) item.summary = dto.summary;
    if (dto.content !== undefined) item.content = dto.content;
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.priority !== undefined) item.priority = dto.priority;
    if (dto.status !== undefined) item.status = dto.status;
    if (dto.requireAcknowledgement !== undefined)
      item.requireAcknowledgement = dto.requireAcknowledgement;
    if (dto.deliveryChannels !== undefined)
      item.deliveryChannels = dto.deliveryChannels;
    if (dto.publishAt !== undefined) {
      item.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
      if (
        item.status === 'SCHEDULED' &&
        item.publishAt &&
        item.publishAt <= new Date()
      ) {
        item.status = 'PUBLISHED';
        item.publishedAt = new Date();
      }
    }
    if (dto.expiresAt !== undefined)
      item.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.targets !== undefined) {
      const targets = Array.isArray(dto.targets)
        ? (dto.targets as TargetItem[])
        : [];
      item.targets = targets;
      item.recipientSummary = this.computeRecipientSummary(targets);
    }
    if (dto.attachments !== undefined) item.attachments = dto.attachments;

    if (updaterId) item.updatedById = updaterId;

    const saved = await this.repo.save(item);
    return this.formatAnnouncement(saved);
  }

  // 5. Delete Announcement (Soft delete in DB)
  async deleteAnnouncement(schoolId: string, id: string, userId?: string) {
    const item = await this.repo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!item) throw new NotFoundException('Announcement not found');

    item.isDeleted = true;
    item.isActive = false;
    if (userId) item.updatedById = userId;

    await this.repo.save(item);
    return { success: true, message: 'Announcement deleted successfully', id };
  }

  // 6. Acknowledge Announcement in DB
  async acknowledgeAnnouncement(schoolId: string, id: string, userId?: string) {
    const item = await this.repo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!item) throw new NotFoundException('Announcement not found');

    const analytics = (item.analytics as AnalyticsData) || {
      totalRecipients: 0,
      deliveredCount: 0,
      viewedCount: 0,
      acknowledgedCount: 0,
      unreadCount: 0,
      pendingAcknowledgementCount: 0,
      acknowledgementRate: 0,
      viewRate: 0,
    };
    analytics.acknowledgedCount = (analytics.acknowledgedCount || 0) + 1;
    analytics.acknowledgementRate = Number(
      (
        (analytics.acknowledgedCount / (analytics.totalRecipients || 1)) *
        100
      ).toFixed(1),
    );
    item.analytics = analytics;
    if (userId) item.updatedById = userId;

    const saved = await this.repo.save(item);
    const formatted = this.formatAnnouncement(saved);
    return {
      ...formatted,
      isAcknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    };
  }

  // Calculate dynamic recipient breakdown for target groups
  private computeRecipientSummary(targets: TargetItem[]): RecipientSummaryData {
    let staffCount = 0;
    let studentCount = 0;
    let parentCount = 0;

    const list = Array.isArray(targets) ? targets : [];
    if (list.length === 0 || list.some((t) => t.targetType === 'EVERYONE')) {
      staffCount = 0;
      studentCount = 0;
      parentCount = 0;
    } else {
      list.forEach((t) => {
        if (
          t.targetType === 'STAFF' ||
          t.targetType === 'TEACHING_STAFF' ||
          t.targetType === 'NON_TEACHING_STAFF'
        ) {
          staffCount += 1;
        }
        if (t.targetType === 'STUDENTS') {
          studentCount += 1;
        }
        if (t.targetType === 'PARENTS') {
          parentCount += 1;
        }
        if (t.targetType === 'CLASS') {
          studentCount += 1;
          parentCount += 1;
        }
        if (t.targetType === 'SECTION') {
          studentCount += 1;
          parentCount += 1;
        }
      });
    }

    const totalCount = staffCount + studentCount + parentCount;
    return { staffCount, studentCount, parentCount, totalCount };
  }

  // Formatter
  private formatAnnouncement(item: AnnouncementEntity) {
    const rawDeliveryChannels = Array.isArray(item.deliveryChannels)
      ? (item.deliveryChannels as string[])
      : ['IN_APP'];
    const rawTargets = Array.isArray(item.targets)
      ? (item.targets as TargetItem[])
      : [];
    const rawAttachments = Array.isArray(item.attachments)
      ? (item.attachments as AttachmentItem[])
      : [];
    const rawRecipientSummary =
      (item.recipientSummary as RecipientSummaryData) || {
        staffCount: 0,
        studentCount: 0,
        parentCount: 0,
        totalCount: 0,
      };
    const rawAnalytics = (item.analytics as AnalyticsData) || {
      totalRecipients: 0,
      deliveredCount: 0,
      viewedCount: 0,
      acknowledgedCount: 0,
      unreadCount: 0,
      pendingAcknowledgementCount: 0,
      acknowledgementRate: 0,
      viewRate: 0,
    };

    return {
      id: String(item.id),
      schoolId: String(item.schoolId),
      academicSessionId: item.academicSessionId
        ? String(item.academicSessionId)
        : null,
      title: item.title,
      summary: item.summary || '',
      content: item.content,
      category: item.category,
      priority: item.priority,
      status: item.status,
      requireAcknowledgement: item.requireAcknowledgement,
      deliveryChannels: rawDeliveryChannels,
      publishAt: item.publishAt ? item.publishAt.toISOString() : null,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
      expiresAt: item.expiresAt ? item.expiresAt.toISOString() : null,
      createdAt: item.createdAt
        ? item.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: item.updatedAt
        ? item.updatedAt.toISOString()
        : new Date().toISOString(),
      createdBy: item.createdById ? String(item.createdById) : 'usr-owner-1',
      createdByName: item.createdByName || 'School Management',
      createdByRole: item.createdByRole || 'School Admin',
      targets: rawTargets,
      attachments: rawAttachments,
      recipientSummary: rawRecipientSummary,
      analytics: rawAnalytics,
    };
  }
}
