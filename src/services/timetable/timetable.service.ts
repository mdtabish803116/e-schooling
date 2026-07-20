import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Timetable {
  id: string;
  name: string;
  academicYearId: string;
  status: 'Draft' | 'Published' | 'Archived';
  version: number;
  createdAt?: string;
}

export interface TimetablePeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: 'Teaching' | 'Break' | 'Assembly';
  displayOrder: number;
}

export interface TimetableSlot {
  id: string;
  timetableId: string;
  day: string;
  periodId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomNo: string;
}

export interface SubstituteTeacherAssignment {
  id: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  date: string;
  periodId: string;
  slotId: string;
}

export interface TimetableEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'exam' | 'event' | 'holiday';
  location?: string;
  schoolId?: string;
}

@Injectable()
export class TimetableService {
  private readonly dbPath = path.resolve(__dirname, 'timetable.db.json');

  constructor() {
    this.ensureDbExists();
  }

  private ensureDbExists() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      const initialData = {
        timetables: [
          {
            id: 'tb-1',
            name: 'Main Academic Term 1 Timetable',
            academicYearId: 'ay-2026',
            status: 'Published',
            version: 1.0,
          },
          {
            id: 'tb-2',
            name: 'Draft Timetable - Mid-Term Revision',
            academicYearId: 'ay-2026',
            status: 'Draft',
            version: 1.1,
          },
        ],
        periods: [
          {
            id: 'per-1',
            name: 'Period 1',
            startTime: '08:30 AM',
            endTime: '09:20 AM',
            type: 'Teaching',
            displayOrder: 1,
          },
          {
            id: 'per-2',
            name: 'Period 2',
            startTime: '09:20 AM',
            endTime: '10:10 AM',
            type: 'Teaching',
            displayOrder: 2,
          },
          {
            id: 'per-break',
            name: 'Short Recess',
            startTime: '10:10 AM',
            endTime: '10:30 AM',
            type: 'Break',
            displayOrder: 3,
          },
          {
            id: 'per-3',
            name: 'Period 3',
            startTime: '10:30 AM',
            endTime: '11:20 AM',
            type: 'Teaching',
            displayOrder: 4,
          },
          {
            id: 'per-4',
            name: 'Period 4',
            startTime: '11:20 AM',
            endTime: '12:10 PM',
            type: 'Teaching',
            displayOrder: 5,
          },
          {
            id: 'per-lunch',
            name: 'Lunch Break',
            startTime: '12:10 PM',
            endTime: '01:00 PM',
            type: 'Break',
            displayOrder: 6,
          },
          {
            id: 'per-5',
            name: 'Period 5',
            startTime: '01:00 PM',
            endTime: '01:50 PM',
            type: 'Teaching',
            displayOrder: 7,
          },
        ],
        slots: [
          {
            id: 'slot-1',
            timetableId: 'tb-1',
            day: 'Monday',
            periodId: 'per-1',
            classId: 'class-10-a',
            className: 'Class 10',
            sectionId: 'sec-a',
            sectionName: 'A',
            subjectId: 'sub-math',
            subjectName: 'Mathematics',
            teacherId: 'stf-2',
            teacherName: 'Ramesh Nair',
            roomNo: 'Room 101',
          },
          {
            id: 'slot-2',
            timetableId: 'tb-1',
            day: 'Monday',
            periodId: 'per-2',
            classId: 'class-10-a',
            className: 'Class 10',
            sectionId: 'sec-a',
            sectionName: 'A',
            subjectId: 'sub-science',
            subjectName: 'Science',
            teacherId: 'stf-1',
            teacherName: 'Ananya Sen',
            roomNo: 'Room 101',
          },
        ],
        substitutions: [],
        events: [
          {
            id: '1',
            title: 'Mathematics Grade 10',
            description: 'Algebra focus',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:30',
            type: 'class',
            location: 'Room 101',
          },
          {
            id: '2',
            title: 'Staff Meeting',
            description: 'Monthly review',
            date: new Date().toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '15:00',
            type: 'event',
            location: 'Conference Room',
          },
        ],
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2), 'utf8');
    }
  }

  private readDb(): {
    timetables: Timetable[];
    periods: TimetablePeriod[];
    slots: TimetableSlot[];
    substitutions: SubstituteTeacherAssignment[];
    events: TimetableEvent[];
  } {
    this.ensureDbExists();
    const content = fs.readFileSync(this.dbPath, 'utf8');
    return JSON.parse(content);
  }

  private writeDb(data: any) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
  }

  // 1. Get Timetables
  getTimetables(schoolId: string): Timetable[] {
    return this.readDb().timetables;
  }

  // 2. Create Timetable Draft
  createTimetable(schoolId: string, name: string): Timetable {
    const db = this.readDb();
    const newTb: Timetable = {
      id: `tb-${Date.now()}`,
      name,
      academicYearId: 'ay-2026',
      status: 'Draft',
      version: 1.0,
      createdAt: new Date().toISOString(),
    };
    db.timetables.push(newTb);
    this.writeDb(db);
    return newTb;
  }

  // 3. Publish Timetable
  publishTimetable(schoolId: string, id: string): Timetable {
    const db = this.readDb();
    db.timetables = db.timetables.map((t) => {
      if (t.id === id) {
        return { ...t, status: 'Published' as const };
      } else if (t.status === 'Published') {
        return { ...t, status: 'Archived' as const };
      }
      return t;
    });
    this.writeDb(db);
    const match = db.timetables.find((t) => t.id === id);
    if (!match) throw new NotFoundException('Timetable not found');
    return match;
  }

  // 4. Clone Timetable
  cloneTimetable(schoolId: string, id: string): Timetable {
    const db = this.readDb();
    const matched = db.timetables.find((t) => t.id === id);
    if (!matched) throw new NotFoundException('Timetable not found');

    const newTb: Timetable = {
      id: `tb-${Date.now()}`,
      name: `${matched.name} (Clone)`,
      academicYearId: matched.academicYearId,
      status: 'Draft',
      version: matched.version + 0.1,
      createdAt: new Date().toISOString(),
    };
    db.timetables.push(newTb);

    // Copy slots
    const clonedSlots = db.slots
      .filter((s) => s.timetableId === id)
      .map((s) => ({
        ...s,
        id: `slot-${Math.random().toString(36).substr(2, 9)}`,
        timetableId: newTb.id,
      }));
    db.slots.push(...clonedSlots);

    this.writeDb(db);
    return newTb;
  }

  // 5. Get Periods
  getPeriods(schoolId: string): TimetablePeriod[] {
    return this.readDb().periods;
  }

  // 6. Create Period
  createPeriod(schoolId: string, payload: any): TimetablePeriod {
    const db = this.readDb();
    const newPer: TimetablePeriod = {
      id: `per-${Date.now()}`,
      name: payload.name,
      startTime: payload.startTime,
      endTime: payload.endTime,
      type: payload.type,
      displayOrder: db.periods.length + 1,
    };
    db.periods.push(newPer);
    this.writeDb(db);
    return newPer;
  }

  // 7. Assign Slot
  assignSlot(schoolId: string, payload: any): TimetableSlot {
    const db = this.readDb();

    // Check teacher conflict
    const teacherConflict = db.slots.find(
      (s) =>
        s.timetableId === payload.timetableId &&
        s.day === payload.day &&
        s.periodId === payload.periodId &&
        s.teacherId === payload.teacherId,
    );
    if (teacherConflict) {
      throw new BadRequestException(
        `Conflict: Teacher ${payload.teacherName} is already assigned to ${teacherConflict.className} - Section ${teacherConflict.sectionName} during this period.`,
      );
    }

    // Check room conflict
    const roomConflict = db.slots.find(
      (s) =>
        s.timetableId === payload.timetableId &&
        s.day === payload.day &&
        s.periodId === payload.periodId &&
        s.roomNo === payload.roomNo,
    );
    if (roomConflict) {
      throw new BadRequestException(
        `Conflict: Classroom ${payload.roomNo} is already occupied by ${roomConflict.className} - Section ${roomConflict.sectionName} during this period.`,
      );
    }

    const newSlot: TimetableSlot = {
      ...payload,
      id: `slot-${Date.now()}`,
    };
    db.slots.push(newSlot);
    this.writeDb(db);
    return newSlot;
  }

  // 8. Update Slot
  updateSlot(schoolId: string, id: string, payload: any): TimetableSlot {
    const db = this.readDb();
    const idx = db.slots.findIndex((s) => s.id === id);
    if (idx === -1) throw new NotFoundException('Timetable slot not found');

    const teacherId = payload.teacherId || db.slots[idx].teacherId;
    const periodId = payload.periodId || db.slots[idx].periodId;
    const day = payload.day || db.slots[idx].day;

    // Check teacher conflict
    const teacherConflict = db.slots.find(
      (s) =>
        s.id !== id &&
        s.timetableId === db.slots[idx].timetableId &&
        s.day === day &&
        s.periodId === periodId &&
        s.teacherId === teacherId,
    );
    if (teacherConflict) {
      throw new BadRequestException(
        `Conflict: Teacher is already assigned to ${teacherConflict.className} - Section ${teacherConflict.sectionName} during this period.`,
      );
    }

    db.slots[idx] = {
      ...db.slots[idx],
      ...payload,
    };
    this.writeDb(db);
    return db.slots[idx];
  }

  // 9. Delete Slot
  deleteSlot(schoolId: string, id: string): any {
    const db = this.readDb();
    db.slots = db.slots.filter((s) => s.id !== id);
    this.writeDb(db);
    return { success: true };
  }

  // 10. Teacher Timetable
  getTeacherTimetable(schoolId: string, teacherId: string): TimetableSlot[] {
    return this.readDb().slots.filter((s) => s.teacherId === teacherId);
  }

  // 11. Class Timetable
  getClassTimetable(schoolId: string, classId: string): TimetableSlot[] {
    if (!classId) return this.readDb().slots;
    return this.readDb().slots.filter((s) => s.classId === classId);
  }

  // 12. Validate Conflicts
  validateConflicts(schoolId: string): any[] {
    const slots = this.readDb().slots;
    const conflicts: any[] = [];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (
          slots[i].timetableId === slots[j].timetableId &&
          slots[i].day === slots[j].day &&
          slots[i].periodId === slots[j].periodId
        ) {
          if (slots[i].teacherId === slots[j].teacherId) {
            conflicts.push({
              id: `conf-t-${i}-${j}`,
              type: 'TeacherCollision',
              description: `Staff member ${slots[i].teacherName} is double-booked for Class ${slots[i].className}-${slots[i].sectionName} and Class ${slots[j].className}-${slots[j].sectionName} on ${slots[i].day} during Period.`,
              severity: 'High',
              slotA: slots[i],
              slotB: slots[j],
            });
          }
          if (slots[i].roomNo === slots[j].roomNo) {
            conflicts.push({
              id: `conf-r-${i}-${j}`,
              type: 'RoomCollision',
              description: `Room ${slots[i].roomNo} is booked for both Class ${slots[i].className}-${slots[i].sectionName} and Class ${slots[j].className}-${slots[j].sectionName} on ${slots[i].day} during Period.`,
              severity: 'High',
              slotA: slots[i],
              slotB: slots[j],
            });
          }
        }
      }
    }
    return conflicts;
  }

  // 13. Dashboard Summary
  getDashboardSummary(schoolId: string): any {
    const db = this.readDb();
    const activeTimetable = db.timetables.find((t) => t.status === 'Published') || null;
    const slots = db.slots.filter((s) => s.timetableId === activeTimetable?.id);
    const conflicts = this.validateConflicts(schoolId);
    const subs = db.substitutions;

    const workloads = [
      {
        teacherId: 'stf-1',
        teacherName: 'Ananya Sen',
        assignedPeriods: slots.filter((s) => s.teacherId === 'stf-1').length,
        maxWeeklyPeriods: 18,
      },
      {
        teacherId: 'stf-2',
        teacherName: 'Ramesh Nair',
        assignedPeriods: slots.filter((s) => s.teacherId === 'stf-2').length,
        maxWeeklyPeriods: 18,
      },
    ];

    return {
      activeTimetable,
      totalClassesScheduled: slots.length,
      conflictsCount: conflicts.length,
      conflictsList: conflicts.slice(0, 3),
      substitutionsCount: subs.length,
      substitutionsList: subs,
      workloads,
    };
  }

  // 14. Assign Substitute Teacher
  assignSubstituteTeacher(schoolId: string, payload: any): SubstituteTeacherAssignment {
    const db = this.readDb();
    const newSub: SubstituteTeacherAssignment = {
      id: `sub-${Date.now()}`,
      originalTeacherId: payload.originalTeacherId,
      originalTeacherName: payload.originalTeacherName || 'Original Teacher',
      substituteTeacherId: payload.substituteTeacherId,
      substituteTeacherName: payload.substituteTeacherName || 'Substitute Teacher',
      date: payload.date,
      periodId: payload.periodId,
      slotId: payload.slotId,
    };
    db.substitutions.push(newSub);
    this.writeDb(db);
    return newSub;
  }

  // 15. Calendar Events
  getEvents(schoolId: string): TimetableEvent[] {
    return this.readDb().events || [];
  }

  addEvent(schoolId: string, payload: any): TimetableEvent {
    const db = this.readDb();
    if (!db.events) db.events = [];
    const newEvent: TimetableEvent = {
      ...payload,
      id: `evt-${Date.now()}`,
      schoolId,
    };
    db.events.push(newEvent);
    this.writeDb(db);
    return newEvent;
  }

  updateEvent(schoolId: string, id: string, payload: any): TimetableEvent {
    const db = this.readDb();
    if (!db.events) db.events = [];
    const idx = db.events.findIndex((e) => e.id === id);
    if (idx === -1) throw new NotFoundException('Event not found');
    db.events[idx] = {
      ...db.events[idx],
      ...payload,
    };
    this.writeDb(db);
    return db.events[idx];
  }

  deleteEvent(schoolId: string, id: string): any {
    const db = this.readDb();
    if (!db.events) db.events = [];
    db.events = db.events.filter((e) => e.id !== id);
    this.writeDb(db);
    return { success: true };
  }
}
