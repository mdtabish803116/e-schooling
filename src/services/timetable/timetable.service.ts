import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { Timetable } from '../../models/entities/timetable/timetable.entity';
import { TimetablePeriod } from '../../models/entities/timetable/timetable-period.entity';
import { TimetableSlot } from '../../models/entities/timetable/timetable-slot.entity';
import { TimetableSubstitution } from '../../models/entities/timetable/timetable-substitution.entity';
import { TimetableEvent } from '../../models/entities/timetable/timetable-event.entity';
import { TimetableSettings } from '../../models/entities/timetable/timetable-settings.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { Subject } from '../../models/entities/academic/subject.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';

import {
  TimetableStatusEnum,
  PeriodTypeEnum,
  TimetableEventTypeEnum,
} from '../../models/enums/enums';

export interface CreatePeriodPayload {
  name?: string;
  startTime?: string;
  endTime?: string;
  type?: PeriodTypeEnum;
  displayOrder?: number;
}

export interface AssignSlotPayload {
  timetableId?: string;
  day?: string;
  periodId?: string;
  teacherId?: string;
  teacherName?: string;
  roomNo?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
}

export interface SubstituteTeacherPayload {
  slotId?: string;
  originalTeacherId?: string;
  substituteTeacherId?: string;
  date?: string;
  periodId?: string | null;
}

export interface TimetableEventPayload {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: TimetableEventTypeEnum;
  location?: string;
}

@Injectable()
export class TimetableService {
  private timetableRepo: Repository<Timetable>;
  private periodRepo: Repository<TimetablePeriod>;
  private slotRepo: Repository<TimetableSlot>;
  private substitutionRepo: Repository<TimetableSubstitution>;
  private eventRepo: Repository<TimetableEvent>;
  private classRepo: Repository<Class>;
  private sectionRepo: Repository<Section>;
  private subjectRepo: Repository<Subject>;
  private userRepo: Repository<SchoolUser>;
  private settingsRepo: Repository<TimetableSettings>;

  constructor(private dataSource: DataSource) {
    this.timetableRepo = this.dataSource.getRepository(Timetable);
    this.periodRepo = this.dataSource.getRepository(TimetablePeriod);
    this.slotRepo = this.dataSource.getRepository(TimetableSlot);
    this.substitutionRepo = this.dataSource.getRepository(
      TimetableSubstitution,
    );
    this.eventRepo = this.dataSource.getRepository(TimetableEvent);
    this.classRepo = this.dataSource.getRepository(Class);
    this.sectionRepo = this.dataSource.getRepository(Section);
    this.subjectRepo = this.dataSource.getRepository(Subject);
    this.userRepo = this.dataSource.getRepository(SchoolUser);
    this.settingsRepo = this.dataSource.getRepository(TimetableSettings);
  }

  // 1. Get Timetables
  async getTimetables(schoolId: string) {
    const timetables = await this.timetableRepo.find({
      where: { schoolId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return timetables.map((t) => ({
      id: t.id,
      name: t.name,
      academicYearId: t.academicYearId || null,
      status: t.status,
      version: Number(t.version) || 1.0,
      createdAt: t.createdAt,
    }));
  }

  // 2. Create Timetable Draft
  async createTimetable(schoolId: string, name: string) {
    const newTb = this.timetableRepo.create({
      schoolId,
      name: name || 'Untitled Timetable',
      academicYearId: null,
      status: TimetableStatusEnum.DRAFT,
      version: 1.0,
      isActive: true,
      isDeleted: false,
    });
    const saved = await this.timetableRepo.save(newTb);
    return {
      id: saved.id,
      name: saved.name,
      academicYearId: saved.academicYearId,
      status: saved.status,
      version: Number(saved.version),
      createdAt: saved.createdAt,
    };
  }

  // 3. Publish Timetable
  async publishTimetable(schoolId: string, id: string) {
    const match = await this.timetableRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!match) throw new NotFoundException('Timetable not found');

    // Set other timetables in school as Archived/Draft if published
    await this.timetableRepo.update(
      { schoolId, isDeleted: false },
      { status: TimetableStatusEnum.DRAFT },
    );

    match.status = TimetableStatusEnum.PUBLISHED;
    const saved = await this.timetableRepo.save(match);

    return {
      id: saved.id,
      name: saved.name,
      academicYearId: saved.academicYearId,
      status: saved.status,
      version: Number(saved.version),
      createdAt: saved.createdAt,
    };
  }

  // 4. Clone Timetable
  async cloneTimetable(schoolId: string, id: string) {
    const matched = await this.timetableRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!matched) throw new NotFoundException('Timetable not found');

    const newVersion = (Number(matched.version) || 1.0) + 0.1;
    const newTb = this.timetableRepo.create({
      schoolId,
      name: `${matched.name} (Copy)`,
      academicYearId: matched.academicYearId,
      status: TimetableStatusEnum.DRAFT,
      version: newVersion,
      isActive: true,
      isDeleted: false,
    });
    const savedTb = await this.timetableRepo.save(newTb);

    // Copy slots
    const existingSlots = await this.slotRepo.find({
      where: { timetableId: id, schoolId, isDeleted: false },
    });

    if (existingSlots.length > 0) {
      const clonedSlots = existingSlots.map((s) =>
        this.slotRepo.create({
          schoolId,
          timetableId: savedTb.id,
          day: s.day,
          periodId: s.periodId,
          classId: s.classId,
          sectionId: s.sectionId,
          subjectId: s.subjectId,
          teacherId: s.teacherId,
          roomNo: s.roomNo,
          isActive: true,
          isDeleted: false,
        }),
      );
      await this.slotRepo.save(clonedSlots);
    }

    return {
      id: savedTb.id,
      name: savedTb.name,
      academicYearId: savedTb.academicYearId,
      status: savedTb.status,
      version: Number(savedTb.version),
      createdAt: savedTb.createdAt,
    };
  }

  // 5. Get Periods
  async getPeriods(schoolId: string) {
    const periods = await this.periodRepo.find({
      where: { schoolId, isDeleted: false },
      order: { displayOrder: 'ASC' },
    });
    return periods.map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime,
      type: p.type,
      displayOrder: p.displayOrder,
    }));
  }

  // 6. Create Period
  async createPeriod(schoolId: string, payload: CreatePeriodPayload) {
    const period = this.periodRepo.create({
      schoolId,
      name: payload.name || 'New Period',
      startTime: payload.startTime || '08:00 AM',
      endTime: payload.endTime || '08:50 AM',
      type: payload.type || PeriodTypeEnum.TEACHING,
      displayOrder: payload.displayOrder || 1,
      isActive: true,
      isDeleted: false,
    });
    const saved = await this.periodRepo.save(period);
    return {
      id: saved.id,
      name: saved.name,
      startTime: saved.startTime,
      endTime: saved.endTime,
      type: saved.type,
      displayOrder: saved.displayOrder,
    };
  }

  // Helper to format slot response
  private async formatSlot(slot: TimetableSlot) {
    let className = '';
    let sectionName = '';
    let subjectName = '';
    let teacherName = '';

    if (slot.class) {
      className = slot.class.name;
    } else if (slot.classId) {
      const cls = await this.classRepo.findOne({ where: { id: slot.classId } });
      if (cls) className = cls.name;
    }

    if (slot.section) {
      sectionName = slot.section.name;
    } else if (slot.sectionId) {
      const sec = await this.sectionRepo.findOne({
        where: { id: slot.sectionId },
      });
      if (sec) sectionName = sec.name;
    }

    if (slot.subject) {
      subjectName = slot.subject.name;
    } else if (slot.subjectId) {
      const sub = await this.subjectRepo.findOne({
        where: { id: slot.subjectId },
      });
      if (sub) subjectName = sub.name;
    }

    if (slot.teacher) {
      teacherName = slot.teacher.name;
    } else if (slot.teacherId) {
      const t = await this.userRepo.findOne({ where: { id: slot.teacherId } });
      if (t) teacherName = t.name;
    }

    let periodName = '';
    let startTime = '';
    let endTime = '';

    if (slot.period) {
      periodName = slot.period.name;
      startTime = slot.period.startTime;
      endTime = slot.period.endTime;
    } else if (slot.periodId) {
      const per = await this.periodRepo.findOne({
        where: { id: slot.periodId },
      });
      if (per) {
        periodName = per.name;
        startTime = per.startTime;
        endTime = per.endTime;
      }
    }

    const timeStr =
      startTime && endTime
        ? `${startTime} - ${endTime}`
        : periodName || `Period ${slot.periodId}`;

    return {
      id: slot.id,
      timetableId: slot.timetableId,
      day: slot.day,
      periodId: slot.periodId,
      periodName: periodName || `Period ${slot.periodId}`,
      startTime,
      endTime,
      time: timeStr,
      classId: slot.classId,
      className,
      sectionId: slot.sectionId,
      sectionName,
      subjectId: slot.subjectId,
      subjectName,
      teacherId: slot.teacherId,
      teacherName,
      roomNo: slot.roomNo || '',
    };
  }

  // Get all timetable slots for a school
  async getTimetableSlots(schoolId: string) {
    const slots = await this.slotRepo.find({
      where: { schoolId, isDeleted: false },
      relations: ['class', 'section', 'subject', 'teacher', 'period'],
    });
    return Promise.all(slots.map((s) => this.formatSlot(s)));
  }

  // 7. Assign Slot
  async assignSlot(schoolId: string, payload: AssignSlotPayload) {
    // Check teacher conflict
    if (payload.teacherId) {
      const teacherConflict = await this.slotRepo.findOne({
        where: {
          timetableId: payload.timetableId,
          schoolId,
          day: payload.day,
          periodId: payload.periodId,
          teacherId: payload.teacherId,
          isDeleted: false,
        },
        relations: ['class', 'section', 'teacher'],
      });
      if (teacherConflict) {
        const teacherName =
          teacherConflict.teacher?.name || payload.teacherName || 'Teacher';
        const clsName = teacherConflict.class?.name || 'Class';
        const secName = teacherConflict.section?.name || 'Section';
        throw new BadRequestException(
          `Conflict: Teacher ${teacherName} is already assigned to ${clsName} - Section ${secName} during this period.`,
        );
      }
    }

    // Check room conflict
    if (payload.roomNo) {
      const roomConflict = await this.slotRepo.findOne({
        where: {
          timetableId: payload.timetableId,
          schoolId,
          day: payload.day,
          periodId: payload.periodId,
          roomNo: payload.roomNo,
          isDeleted: false,
        },
        relations: ['class', 'section'],
      });
      if (roomConflict) {
        const clsName = roomConflict.class?.name || 'Class';
        const secName = roomConflict.section?.name || 'Section';
        throw new BadRequestException(
          `Conflict: Room ${payload.roomNo} is already in use by ${clsName} - Section ${secName} during this period.`,
        );
      }
    }

    const newSlot = this.slotRepo.create({
      schoolId,
      timetableId: payload.timetableId,
      day: payload.day,
      periodId: payload.periodId,
      classId: payload.classId,
      sectionId: payload.sectionId,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId,
      roomNo: payload.roomNo || '',
      isActive: true,
      isDeleted: false,
    });

    const saved = await this.slotRepo.save(newSlot);
    return this.formatSlot(saved);
  }

  // 8. Update Slot
  async updateSlot(schoolId: string, id: string, payload: AssignSlotPayload) {
    const existing = await this.slotRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Timetable slot not found');

    const timetableId = payload.timetableId || existing.timetableId;
    const day = payload.day || existing.day;
    const periodId = payload.periodId || existing.periodId;
    const teacherId =
      payload.teacherId !== undefined ? payload.teacherId : existing.teacherId;
    const roomNo =
      payload.roomNo !== undefined ? payload.roomNo : existing.roomNo;

    // Check teacher conflict
    if (teacherId) {
      const teacherConflict = await this.slotRepo.findOne({
        where: {
          timetableId,
          schoolId,
          day,
          periodId,
          teacherId,
          isDeleted: false,
        },
        relations: ['class', 'section', 'teacher'],
      });
      if (teacherConflict && teacherConflict.id !== id) {
        const teacherName =
          teacherConflict.teacher?.name || payload.teacherName || 'Teacher';
        const clsName = teacherConflict.class?.name || 'Class';
        const secName = teacherConflict.section?.name || 'Section';
        throw new BadRequestException(
          `Conflict: Teacher ${teacherName} is already assigned to ${clsName} - Section ${secName} during this period.`,
        );
      }
    }

    // Check room conflict
    if (roomNo) {
      const roomConflict = await this.slotRepo.findOne({
        where: {
          timetableId,
          schoolId,
          day,
          periodId,
          roomNo,
          isDeleted: false,
        },
        relations: ['class', 'section'],
      });
      if (roomConflict && roomConflict.id !== id) {
        const clsName = roomConflict.class?.name || 'Class';
        const secName = roomConflict.section?.name || 'Section';
        throw new BadRequestException(
          `Conflict: Room ${roomNo} is already in use by ${clsName} - Section ${secName} during this period.`,
        );
      }
    }

    Object.assign(existing, {
      timetableId,
      day,
      periodId,
      classId: payload.classId || existing.classId,
      sectionId: payload.sectionId || existing.sectionId,
      subjectId: payload.subjectId || existing.subjectId,
      teacherId,
      roomNo,
    });

    const saved = await this.slotRepo.save(existing);
    return this.formatSlot(saved);
  }

  // 9. Delete Slot
  async deleteSlot(schoolId: string, id: string) {
    const existing = await this.slotRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Timetable slot not found');

    existing.isDeleted = true;
    existing.isActive = false;
    await this.slotRepo.save(existing);

    return { success: true, message: 'Timetable slot deleted' };
  }

  // 10. Teacher Timetable
  async getTeacherTimetable(schoolId: string, teacherId: string) {
    const slots = await this.slotRepo.find({
      where: { schoolId, teacherId, isDeleted: false },
      relations: ['class', 'section', 'subject', 'teacher', 'period'],
    });

    const formatted = await Promise.all(slots.map((s) => this.formatSlot(s)));
    return formatted;
  }

  // 11. Class Timetable
  async getClassTimetable(schoolId: string, classId: string) {
    const slots = await this.slotRepo.find({
      where: { schoolId, classId, isDeleted: false },
      relations: ['class', 'section', 'subject', 'teacher', 'period'],
    });

    const formatted = await Promise.all(slots.map((s) => this.formatSlot(s)));
    return formatted;
  }

  // 11b. Student Specific Timetable
  async getStudentTimetable(schoolId: string, studentId: string) {
    let classId: string | null = null;
    let sectionId: string | null = null;

    try {
      const enrollment = await this.dataSource
        .getRepository(StudentEnrollment)
        .findOne({
          where: [
            {
              studentId: String(studentId),
              schoolId: String(schoolId),
              isDeleted: false,
            },
            {
              id: String(studentId),
              schoolId: String(schoolId),
              isDeleted: false,
            },
          ],
        });

      if (enrollment) {
        classId = String(enrollment.classId);
        sectionId = String(enrollment.sectionId);
      }
    } catch {
      // Ignore error if student enrollment lookup fails
    }

    if (!classId) {
      try {
        const rows = await this.dataSource.query<
          { class_id: string; section_id: string }[]
        >(
          `SELECT class_id, section_id FROM "e_schooling"."student_enrollments" WHERE (student_id = $1 OR id = $1) AND school_id = $2 AND is_delete = false LIMIT 1`,
          [studentId, schoolId],
        );
        if (rows && rows.length > 0) {
          classId = String(rows[0].class_id);
          sectionId = String(rows[0].section_id);
        }
      } catch {
        // Ignore error if fallback query fails
      }
    }

    if (!classId) {
      classId = String(studentId);
    }

    const whereClause: FindOptionsWhere<TimetableSlot> = {
      schoolId,
      classId,
      isDeleted: false,
    };
    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    let slots = await this.slotRepo.find({
      where: whereClause,
      relations: ['class', 'section', 'subject', 'teacher', 'period'],
    });

    if (!slots.length && sectionId) {
      slots = await this.slotRepo.find({
        where: { schoolId, classId, isDeleted: false },
        relations: ['class', 'section', 'subject', 'teacher', 'period'],
      });
    }

    const formatted = await Promise.all(slots.map((s) => this.formatSlot(s)));
    return formatted;
  }

  // 12. Validate Conflicts
  async validateConflicts(schoolId: string) {
    const slots = await this.slotRepo.find({
      where: { schoolId, isDeleted: false },
      relations: ['class', 'section', 'teacher'],
    });

    const conflicts: { type: string; description: string }[] = [];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];
        if (
          s1.timetableId === s2.timetableId &&
          s1.day === s2.day &&
          s1.periodId === s2.periodId
        ) {
          if (s1.teacherId && s1.teacherId === s2.teacherId) {
            conflicts.push({
              type: 'Teacher Overlap',
              description: `Teacher ${s1.teacher?.name || s1.teacherId} assigned to ${s1.class?.name || 'Class'} (${s1.section?.name || 'Section'}) and ${s2.class?.name || 'Class'} (${s2.section?.name || 'Section'}) on ${s1.day} Period ${s1.periodId}`,
            });
          }
          if (s1.roomNo && s1.roomNo === s2.roomNo) {
            conflicts.push({
              type: 'Room Double-Booking',
              description: `Room ${s1.roomNo} booked for both ${s1.class?.name || 'Class'} and ${s2.class?.name || 'Class'} on ${s1.day} Period ${s1.periodId}`,
            });
          }
        }
      }
    }
    return conflicts;
  }

  // 13. Dashboard Summary
  async getDashboardSummary(schoolId: string) {
    const timetablesCount = await this.timetableRepo.count({
      where: { schoolId, isDeleted: false },
    });
    const activeTimetable = await this.timetableRepo.findOne({
      where: {
        schoolId,
        status: TimetableStatusEnum.PUBLISHED,
        isDeleted: false,
      },
    });
    const slotsCount = await this.slotRepo.count({
      where: { schoolId, isDeleted: false },
    });
    const periodsCount = await this.periodRepo.count({
      where: { schoolId, isDeleted: false },
    });
    const substitutionsCount = await this.substitutionRepo.count({
      where: { schoolId, isDeleted: false },
    });
    const conflicts = await this.validateConflicts(schoolId);

    return {
      totalTimetables: timetablesCount,
      activeTimetableName: activeTimetable ? activeTimetable.name : 'None',
      totalSlotsAllocated: slotsCount,
      totalPeriods: periodsCount,
      activeSubstitutions: substitutionsCount,
      conflictsCount: conflicts.length,
    };
  }

  // 14. Assign Substitute Teacher
  async assignSubstituteTeacher(
    schoolId: string,
    payload: SubstituteTeacherPayload,
  ) {
    if (
      !payload.slotId ||
      !payload.originalTeacherId ||
      !payload.substituteTeacherId
    ) {
      throw new BadRequestException(
        'slotId, originalTeacherId, and substituteTeacherId are required',
      );
    }
    const sub = this.substitutionRepo.create({
      schoolId,
      slotId: payload.slotId,
      originalTeacherId: payload.originalTeacherId,
      substituteTeacherId: payload.substituteTeacherId,
      date: payload.date || new Date().toISOString().split('T')[0],
      periodId: payload.periodId || null,
      isActive: true,
      isDeleted: false,
    });
    const saved = await this.substitutionRepo.save(sub);
    return {
      id: saved.id,
      slotId: saved.slotId,
      originalTeacherId: saved.originalTeacherId,
      substituteTeacherId: saved.substituteTeacherId,
      date: saved.date,
      periodId: saved.periodId,
    };
  }

  // 15. Get Events
  async getEvents(schoolId: string) {
    const events = await this.eventRepo.find({
      where: { schoolId, isDeleted: false },
      order: { date: 'ASC' },
    });
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      type: e.type,
      location: e.location,
    }));
  }

  // 16. Add Event
  async addEvent(schoolId: string, payload: TimetableEventPayload) {
    const event = this.eventRepo.create({
      schoolId,
      title: payload.title || 'New Event',
      description: payload.description || '',
      date: payload.date || new Date().toISOString().split('T')[0],
      startTime: payload.startTime || '09:00',
      endTime: payload.endTime || '10:00',
      type: payload.type || TimetableEventTypeEnum.EVENT,
      location: payload.location || '',
      isActive: true,
      isDeleted: false,
    });
    const saved = await this.eventRepo.save(event);
    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      date: saved.date,
      startTime: saved.startTime,
      endTime: saved.endTime,
      type: saved.type,
      location: saved.location,
    };
  }

  // 17. Update Event
  async updateEvent(
    schoolId: string,
    id: string,
    payload: Partial<TimetableEventPayload>,
  ) {
    const existing = await this.eventRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Event not found');

    Object.assign(existing, {
      title: payload.title !== undefined ? payload.title : existing.title,
      description:
        payload.description !== undefined
          ? payload.description
          : existing.description,
      date: payload.date !== undefined ? payload.date : existing.date,
      startTime:
        payload.startTime !== undefined
          ? payload.startTime
          : existing.startTime,
      endTime:
        payload.endTime !== undefined ? payload.endTime : existing.endTime,
      type: payload.type !== undefined ? payload.type : existing.type,
      location:
        payload.location !== undefined ? payload.location : existing.location,
    });

    const saved = await this.eventRepo.save(existing);
    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      date: saved.date,
      startTime: saved.startTime,
      endTime: saved.endTime,
      type: saved.type,
      location: saved.location,
    };
  }

  // 18. Delete Event
  async deleteEvent(schoolId: string, id: string) {
    const existing = await this.eventRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Event not found');

    existing.isDeleted = true;
    existing.isActive = false;
    await this.eventRepo.save(existing);

    return { success: true, message: 'Event deleted successfully' };
  }

  // 19. Get Timetable Settings
  async getTimetableSettings(
    schoolId: string,
    academicSessionId?: string,
  ): Promise<TimetableSettings> {
    const whereClause: any = { schoolId, isDeleted: false, isActive: true };
    if (academicSessionId) {
      whereClause.academicSessionId = academicSessionId;
    }
    const existing = await this.settingsRepo.findOne({ where: whereClause });
    if (existing) return existing;

    // Default settings if not configured in DB yet
    return this.settingsRepo.create({
      schoolId,
      academicSessionId: academicSessionId || null,
      maxPeriodsPerDay: 8,
      periodDurationMinutes: 45,
      breakDurationMinutes: 15,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '08:00 AM',
      endTime: '03:30 PM',
      allowTeacherCollisions: false,
      allowRoomCollisions: false,
      autoSubstitutionAlerts: true,
      isActive: true,
      isDeleted: false,
    });
  }

  // 20. Upsert Timetable Settings
  async upsertTimetableSettings(
    schoolId: string,
    payload: any,
  ): Promise<TimetableSettings> {
    const whereClause: any = { schoolId, isDeleted: false, isActive: true };
    if (payload?.academicSessionId) {
      whereClause.academicSessionId = payload.academicSessionId;
    }
    let settings = await this.settingsRepo.findOne({ where: whereClause });
    if (!settings) {
      settings = this.settingsRepo.create({
        schoolId,
        academicSessionId: payload?.academicSessionId || null,
        maxPeriodsPerDay: payload?.maxPeriodsPerDay ?? 8,
        periodDurationMinutes: payload?.periodDurationMinutes ?? 45,
        breakDurationMinutes: payload?.breakDurationMinutes ?? 15,
        workingDays: payload?.workingDays ?? [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        startTime: payload?.startTime ?? '08:00 AM',
        endTime: payload?.endTime ?? '03:30 PM',
        allowTeacherCollisions: payload?.allowTeacherCollisions ?? false,
        allowRoomCollisions: payload?.allowRoomCollisions ?? false,
        autoSubstitutionAlerts: payload?.autoSubstitutionAlerts ?? true,
        isActive: true,
        isDeleted: false,
      });
    } else {
      if (payload?.maxPeriodsPerDay !== undefined)
        settings.maxPeriodsPerDay = payload.maxPeriodsPerDay;
      if (payload?.periodDurationMinutes !== undefined)
        settings.periodDurationMinutes = payload.periodDurationMinutes;
      if (payload?.breakDurationMinutes !== undefined)
        settings.breakDurationMinutes = payload.breakDurationMinutes;
      if (payload?.workingDays !== undefined)
        settings.workingDays = payload.workingDays;
      if (payload?.startTime !== undefined)
        settings.startTime = payload.startTime;
      if (payload?.endTime !== undefined) settings.endTime = payload.endTime;
      if (payload?.allowTeacherCollisions !== undefined)
        settings.allowTeacherCollisions = payload.allowTeacherCollisions;
      if (payload?.allowRoomCollisions !== undefined)
        settings.allowRoomCollisions = payload.allowRoomCollisions;
      if (payload?.autoSubstitutionAlerts !== undefined)
        settings.autoSubstitutionAlerts = payload.autoSubstitutionAlerts;
    }

    return await this.settingsRepo.save(settings);
  }
}
