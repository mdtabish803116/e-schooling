import { Injectable, OnModuleInit, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthContext } from '../../interfaces/auth-context.interface';
import { CreateHolidayDto } from '../../interfaces/request/academic/create-holiday.dto';
import { Holiday } from '../../models/entities/academic/holiday.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';

@Injectable()
export class HolidayService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."holidays" (
          "id" BIGSERIAL PRIMARY KEY,
          "school_id" bigint,
          "title" varchar NOT NULL,
          "description" text,
          "from_date" date NOT NULL,
          "to_date" date NOT NULL,
          "academic_session_id" bigint,
          "is_active" boolean NOT NULL DEFAULT true,
          "is_delete" boolean NOT NULL DEFAULT false,
          "created_by_id" bigint,
          "updated_by_id" bigint,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_holidays_school_id" ON "e_schooling"."holidays" ("school_id");
      `);
    } catch (e) {
      console.warn('Auto-creating holidays table:', e);
    }
  }

  private async assertAccessToSchool(caller: AuthContext, schoolId: string): Promise<void> {
    if (caller.actorType === 'school_owner') {
      const membership = await this.dataSource
        .getRepository(SchoolOwnerMember)
        .findOne({ where: { schoolOwnerId: caller.id, schoolId } });
      if (!membership) {
        throw new ForbiddenException('You do not have access to this school');
      }
    } else if (caller.actorType === 'school_user') {
      if (String(caller.schoolId) !== String(schoolId)) {
        throw new ForbiddenException('You do not belong to this school');
      }
    }
  }

  async getHolidays(caller: AuthContext, schoolId: string) {
    await this.assertAccessToSchool(caller, schoolId);
    const holidayRepo = this.dataSource.getRepository(Holiday);
    return holidayRepo.find({
      where: { schoolId, isDeleted: false },
      order: { fromDate: 'ASC' },
    });
  }

  async createHoliday(caller: AuthContext, schoolId: string, dto: CreateHolidayDto) {
    await this.assertAccessToSchool(caller, schoolId);
    const holidayRepo = this.dataSource.getRepository(Holiday);
    const holiday = holidayRepo.create({
      schoolId,
      title: dto.title,
      fromDate: dto.fromDate,
      toDate: dto.toDate || dto.fromDate,
      description: dto.description || '',
      academicSessionId: dto.academicSessionId || null,
      createdById: caller.id,
      updatedById: caller.id,
      isActive: true,
      isDeleted: false,
    });
    return holidayRepo.save(holiday);
  }

  async updateHoliday(
    caller: AuthContext,
    schoolId: string,
    holidayId: string,
    dto: Partial<CreateHolidayDto>,
  ) {
    await this.assertAccessToSchool(caller, schoolId);
    const holidayRepo = this.dataSource.getRepository(Holiday);
    const holiday = await holidayRepo.findOne({
      where: { id: holidayId, schoolId, isDeleted: false },
    });
    if (!holiday) throw new NotFoundException('Holiday not found');

    if (dto.title !== undefined) holiday.title = dto.title;
    if (dto.fromDate !== undefined) holiday.fromDate = dto.fromDate;
    if (dto.toDate !== undefined) holiday.toDate = dto.toDate;
    if (dto.description !== undefined) holiday.description = dto.description;
    if (dto.academicSessionId !== undefined) holiday.academicSessionId = dto.academicSessionId;
    holiday.updatedById = caller.id;

    return holidayRepo.save(holiday);
  }

  async deleteHoliday(caller: AuthContext, schoolId: string, holidayId: string) {
    await this.assertAccessToSchool(caller, schoolId);
    const holidayRepo = this.dataSource.getRepository(Holiday);
    const holiday = await holidayRepo.findOne({
      where: { id: holidayId, schoolId, isDeleted: false },
    });
    if (!holiday) throw new NotFoundException('Holiday not found');
    holiday.isDeleted = true;
    await holidayRepo.save(holiday);
    return { message: 'Holiday deleted successfully' };
  }
}
