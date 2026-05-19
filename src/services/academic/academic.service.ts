import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { Subject } from '../../models/entities/academic/subject.entity';
import { ClassSectionSubject } from '../../models/entities/academic/class-section-subject.entity';
import { CreateClassDto } from '../../interfaces/request/academic/create-class.dto';
import { UpdateClassDto } from '../../interfaces/request/academic/update-class.dto';
import { CreateSectionDto } from '../../interfaces/request/academic/create-section.dto';
import { UpdateSectionDto } from '../../interfaces/request/academic/update-section.dto';
import { UpdateSubjectDto } from '../../interfaces/request/academic/update-subject.dto';
import { TransferStudentsDto } from '../../interfaces/request/academic/transfer-students.dto';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { SectionTransferHistory } from '../../models/entities/student/section-transfer-history.entity';

@Injectable()
export class AcademicService {
  private classRepo: Repository<Class>;
  private sectionRepo: Repository<Section>;
  private subjectRepo: Repository<Subject>;
  private mappingRepo: Repository<ClassSectionSubject>;

  constructor(private dataSource: DataSource) {
    this.classRepo = this.dataSource.getRepository(Class);
    this.sectionRepo = this.dataSource.getRepository(Section);
    this.subjectRepo = this.dataSource.getRepository(Subject);
    this.mappingRepo = this.dataSource.getRepository(ClassSectionSubject);
  }

  // CLASSES
  async createClass(schoolId: string, data: CreateClassDto, userId: string) {
    const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();

    // Check if class with same normalized name exists in the school
    const existingClasses = await this.classRepo.find({ where: { schoolId } });
    const match = existingClasses.find(c => c.name.replace(/\s+/g, '').toLowerCase() === normalizedInput);

    if (match) {
      if (match.isDeleted) {
        // Upsert: restore and make active
        match.isDeleted = false;
        match.isActive = true;
        match.name = data.name; // Keep input casing
        match.dailyAttendanceLimit = data.dailyAttendanceLimit ?? match.dailyAttendanceLimit;
        match.updatedById = userId;
        const saved = await this.classRepo.save(match);

        // Also check/restore the default section for this class
        const defaultSection = await this.sectionRepo.findOne({
          where: { classId: saved.id, schoolId, name: 'default', isDefault: true }
        });
        if (defaultSection) {
          defaultSection.isDeleted = false;
          defaultSection.isActive = true;
          defaultSection.updatedById = userId;
          await this.sectionRepo.save(defaultSection);
        } else {
          const newDefaultSection = this.sectionRepo.create({
            schoolId,
            classId: saved.id,
            name: 'default',
            isDefault: true,
            isActive: true,
            createdById: userId,
            updatedById: userId,
          });
          await this.sectionRepo.save(newDefaultSection);
        }

        return saved;
      }

      if (!match.isActive) {
        throw new BadRequestException('This class already exists with inactive status');
      }

      throw new BadRequestException('This class already exists');
    }

    const newClass = this.classRepo.create({
      ...data,
      schoolId,
      hasSections: false, // Force false by default, not taken from user input
      createdById: userId,
      updatedById: userId,
    });
    const savedClass = await this.classRepo.save(newClass);

    // Automatically create a default section since hasSections is false
    const defaultSection = this.sectionRepo.create({
      schoolId,
      classId: savedClass.id,
      name: 'default',
      isDefault: true,
      isActive: true,
      createdById: userId,
      updatedById: userId,
    });
    await this.sectionRepo.save(defaultSection);

    return savedClass;
  }

  async getClasses(schoolId: string) {
    return await this.classRepo.find({ where: { schoolId, isDeleted: false } });
  }

  async updateClass(schoolId: string, id: string, data: UpdateClassDto, userId: string) {
    const existing = await this.classRepo.findOne({ where: { id, schoolId, isDeleted: false } });
    if (!existing) throw new NotFoundException('Class not found');

    if (data.name) {
      const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();
      const existingClasses = await this.classRepo.find({ where: { schoolId } });
      const match = existingClasses.find(c => c.id !== id && c.name.replace(/\s+/g, '').toLowerCase() === normalizedInput);

      if (match) {
        if (match.isDeleted) {
          // Soft-delete the class being updated (renamed)
          existing.isDeleted = true;
          existing.updatedById = userId;
          await this.classRepo.save(existing);

          // Restore the matching deleted class
          match.isDeleted = false;
          match.isActive = true;
          match.name = data.name; // Keep input casing
          match.dailyAttendanceLimit = data.dailyAttendanceLimit ?? match.dailyAttendanceLimit;
          match.updatedById = userId;
          const saved = await this.classRepo.save(match);

          // Restore default section if needed
          const defaultSection = await this.sectionRepo.findOne({
            where: { classId: saved.id, schoolId, name: 'default', isDefault: true }
          });
          if (defaultSection) {
            defaultSection.isDeleted = false;
            defaultSection.isActive = true;
            defaultSection.updatedById = userId;
            await this.sectionRepo.save(defaultSection);
          } else {
            const newDefaultSection = this.sectionRepo.create({
              schoolId,
              classId: saved.id,
              name: 'default',
              isDefault: true,
              isActive: true,
              createdById: userId,
              updatedById: userId,
            });
            await this.sectionRepo.save(newDefaultSection);
          }

          return saved;
        }

        if (!match.isActive) {
          throw new BadRequestException('This class already exists with inactive status');
        }

        throw new BadRequestException('This class already exists');
      }
    }

    Object.assign(existing, { ...data, updatedById: userId });
    return await this.classRepo.save(existing);
  }

  async deleteClass(schoolId: string, id: string, userId: string) {
    const existing = await this.classRepo.findOne({ where: { id, schoolId, isDeleted: false } });
    if (!existing) throw new NotFoundException('Class not found');
    existing.isDeleted = true;
    existing.updatedById = userId;
    return await this.classRepo.save(existing);
  }

  // SECTIONS
  async createSection(schoolId: string, data: CreateSectionDto, userId: string) {
    // 1. Validate that the class exists and belongs to the same school
    const parentClass = await this.classRepo.findOne({
      where: { id: data.classId, schoolId, isDeleted: false },
    });
    if (!parentClass) {
      throw new NotFoundException('Class not found');
    }

    const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();

    // 2. Validate section name uniqueness in the same class and school
    const existingSections = await this.sectionRepo.find({
      where: { schoolId, classId: data.classId },
    });
    const match = existingSections.find(s => s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput);

    if (match) {
      if (match.isDeleted) {
        // Upsert: restore and make active
        match.isDeleted = false;
        match.isActive = true;
        match.name = data.name;
        match.updatedById = userId;

        // If the class didn't have sections marked, mark it
        if (!parentClass.hasSections) {
          parentClass.hasSections = true;
          parentClass.updatedById = userId;
          await this.classRepo.save(parentClass);
        }

        // Check if there was a default section and soft-delete/deactivate it if restoring a custom one
        const defaultSection = await this.sectionRepo.findOne({
          where: { classId: data.classId, schoolId, name: 'default', isDefault: true, isDeleted: false }
        });
        if (defaultSection) {
          defaultSection.isDeleted = true;
          defaultSection.isActive = false;
          defaultSection.updatedById = userId;
          await this.sectionRepo.save(defaultSection);
        }

        return await this.sectionRepo.save(match);
      }

      if (!match.isActive) {
        throw new BadRequestException('This section already exists with inactive status');
      }

      throw new BadRequestException('This section already exists in this class');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let migratedCount = 0;
      // Find existing active default section
      const defaultSection = await queryRunner.manager.findOne(Section, {
        where: {
          classId: data.classId,
          schoolId,
          name: 'default',
          isDefault: true,
          isDeleted: false,
        },
      });

      // Mark the Class as having multiple sections
      if (!parentClass.hasSections) {
        parentClass.hasSections = true;
        parentClass.updatedById = userId;
        await queryRunner.manager.save(Class, parentClass);
      }

      // Create new section
      const section = queryRunner.manager.create(Section, {
        ...data,
        schoolId,
        isDefault: false,
        createdById: userId,
        updatedById: userId,
      });
      const savedSection = await queryRunner.manager.save(Section, section);

      if (defaultSection) {
        // Soft-delete the default section
        defaultSection.isDeleted = true;
        defaultSection.isActive = false;
        defaultSection.updatedById = userId;
        await queryRunner.manager.save(Section, defaultSection);

        // Find all student enrollments that were assigned to the default section
        const defaultEnrollments = await queryRunner.manager.find(StudentEnrollment, {
          where: {
            schoolId,
            classId: data.classId,
            sectionId: defaultSection.id,
            isDeleted: false,
            isActive: true,
          },
        });

        if (defaultEnrollments.length > 0) {
          // 1. Move them to the new custom section
          await queryRunner.manager.update(
            StudentEnrollment,
            {
              schoolId,
              classId: data.classId,
              sectionId: defaultSection.id,
              isDeleted: false,
              isActive: true,
            },
            {
              sectionId: savedSection.id,
              updatedById: userId,
            }
          );

          // 2. Insert audited section transfer histories
          const transferHistories = defaultEnrollments.map(enrollment => {
            return queryRunner.manager.create(SectionTransferHistory, {
              schoolId,
              studentEnrollmentId: enrollment.id,
              oldSectionId: defaultSection.id,
              newSectionId: savedSection.id,
              reason: 'Automatic migration from default section during custom section creation',
              changedBy: userId,
              changedAt: new Date(),
              isActive: true,
              isDeleted: false,
            });
          });
          await queryRunner.manager.save(SectionTransferHistory, transferHistories);
          migratedCount = defaultEnrollments.length;
        }
      }

      await queryRunner.commitTransaction();

      return {
        ...savedSection,
        migrationMeta: migratedCount > 0 ? {
          migratedCount,
          message: `Since this class previously had no sections, all ${migratedCount} active student(s) have been automatically migrated to this newly created section (${savedSection.name}) so they remain active.`,
        } : null,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSections(schoolId: string, classId?: string) {
    const where: any = { schoolId, isDeleted: false };
    if (classId) where.classId = classId;
    return await this.sectionRepo.find({ where });
  }

  async updateSection(schoolId: string, id: string, data: UpdateSectionDto, userId: string) {
    const existing = await this.sectionRepo.findOne({ where: { id, schoolId, isDeleted: false } });
    if (!existing) throw new NotFoundException('Section not found');

    if (data.name) {
      const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();
      const existingSections = await this.sectionRepo.find({ where: { schoolId, classId: existing.classId } });
      const match = existingSections.find(s => s.id !== id && s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput);

      if (match) {
        if (match.isDeleted) {
          // Soft-delete the section being updated
          existing.isDeleted = true;
          existing.updatedById = userId;
          await this.sectionRepo.save(existing);

          // Restore matching deleted section
          match.isDeleted = false;
          match.isActive = true;
          match.name = data.name;
          match.updatedById = userId;
          return await this.sectionRepo.save(match);
        }

        if (!match.isActive) {
          throw new BadRequestException('This section already exists with inactive status');
        }

        throw new BadRequestException('This section already exists in this class');
      }
    }

    Object.assign(existing, { ...data, updatedById: userId });
    return await this.sectionRepo.save(existing);
  }

  async transferStudents(schoolId: string, dto: TransferStudentsDto, userId: string) {
    const { studentEnrollmentIds, targetSectionId, reason } = dto;

    const targetSection = await this.sectionRepo.findOne({
      where: { id: targetSectionId, schoolId, isDeleted: false, isActive: true },
    });
    if (!targetSection) {
      throw new NotFoundException('Target section not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const enrollmentId of studentEnrollmentIds) {
        const enrollment = await queryRunner.manager.findOne(StudentEnrollment, {
          where: { id: enrollmentId, schoolId, isDeleted: false, isActive: true },
        });

        if (!enrollment) {
          throw new NotFoundException(`Student enrollment with ID ${enrollmentId} not found`);
        }

        // Only transfer if they are actually in a different section
        if (enrollment.sectionId !== targetSectionId) {
          const oldSectionId = enrollment.sectionId;

          // Update student section
          enrollment.sectionId = targetSectionId;
          enrollment.updatedById = userId;
          await queryRunner.manager.save(StudentEnrollment, enrollment);

          // Log section transfer history
          const history = queryRunner.manager.create(SectionTransferHistory, {
            schoolId,
            studentEnrollmentId: enrollmentId,
            oldSectionId,
            newSectionId: targetSectionId,
            reason: reason || 'Bulk manual section transfer',
            changedBy: userId,
            changedAt: new Date(),
            isActive: true,
            isDeleted: false,
          });
          await queryRunner.manager.save(SectionTransferHistory, history);
        }
      }

      await queryRunner.commitTransaction();
      return { message: 'Students transferred successfully', count: studentEnrollmentIds.length };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // SUBJECTS
  async createSubject(schoolId: string, data: Partial<Subject>, userId: string) {
    if (!data.name) {
      throw new BadRequestException('Subject name is required');
    }

    const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();

    // Check if subject with same normalized name exists in the school
    const existingSubjects = await this.subjectRepo.find({ where: { schoolId } });
    const match = existingSubjects.find(s => s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput);

    if (match) {
      if (match.isDeleted) {
        match.isDeleted = false;
        match.isActive = true;
        match.name = data.name;
        match.updatedById = userId;
        return await this.subjectRepo.save(match);
      }

      if (!match.isActive) {
        throw new BadRequestException('This subject already exists with inactive status');
      }

      throw new BadRequestException('This subject already exists');
    }

    const subject = this.subjectRepo.create({
      ...data,
      schoolId,
      createdById: userId,
      updatedById: userId,
    });
    return await this.subjectRepo.save(subject);
  }

  async getSubjects(schoolId: string) {
    return await this.subjectRepo.find({ where: { schoolId, isDeleted: false } });
  }

  async updateSubject(schoolId: string, id: string, data: UpdateSubjectDto, userId: string) {
    const existing = await this.subjectRepo.findOne({ where: { id, schoolId, isDeleted: false } });
    if (!existing) throw new NotFoundException('Subject not found');

    if (data.name) {
      const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();
      const existingSubjects = await this.subjectRepo.find({ where: { schoolId } });
      const match = existingSubjects.find(s => s.id !== id && s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput);

      if (match) {
        if (match.isDeleted) {
          // Soft-delete the subject being updated
          existing.isDeleted = true;
          existing.updatedById = userId;
          await this.subjectRepo.save(existing);

          // Restore matching deleted subject
          match.isDeleted = false;
          match.isActive = true;
          match.name = data.name;
          match.updatedById = userId;
          return await this.subjectRepo.save(match);
        }

        if (!match.isActive) {
          throw new BadRequestException('This subject already exists with inactive status');
        }

        throw new BadRequestException('This subject already exists');
      }
    }

    Object.assign(existing, { ...data, updatedById: userId });
    return await this.subjectRepo.save(existing);
  }

  // MAPPINGS
  async assignSubjectToClassSection(schoolId: string, data: Partial<ClassSectionSubject>, userId: string) {
    const { classId, sectionId, subjectId } = data;

    if (!classId || !sectionId || !subjectId) {
      throw new BadRequestException('classId, sectionId, and subjectId are required');
    }

    // 1. Validate existence of class, section, subject in the school
    const cls = await this.classRepo.findOne({ where: { id: classId, schoolId, isDeleted: false } });
    if (!cls) throw new NotFoundException('Class not found');

    const sec = await this.sectionRepo.findOne({ where: { id: sectionId, classId, schoolId, isDeleted: false } });
    if (!sec) throw new NotFoundException('Section not found');

    const sub = await this.subjectRepo.findOne({ where: { id: subjectId, schoolId, isDeleted: false } });
    if (!sub) throw new NotFoundException('Subject not found');

    // 2. Validate uniqueness of the mapping
    const existing = await this.mappingRepo.findOne({
      where: { schoolId, classId, sectionId, subjectId }
    });

    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        existing.isActive = true;
        existing.teacherId = data.teacherId ?? existing.teacherId;
        existing.updatedById = userId;
        return await this.mappingRepo.save(existing);
      }

      if (!existing.isActive) {
        throw new BadRequestException('This subject mapping already exists with inactive status');
      }

      throw new BadRequestException('This subject is already mapped to this class and section');
    }

    const mapping = this.mappingRepo.create({
      ...data,
      schoolId,
      createdById: userId,
      updatedById: userId,
    });
    return await this.mappingRepo.save(mapping);
  }

  async getMappings(schoolId: string, classId?: string, sectionId?: string) {
    const where: any = { schoolId };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    return await this.mappingRepo.find({ where, relations: ['class', 'section', 'subject'] });
  }
}
