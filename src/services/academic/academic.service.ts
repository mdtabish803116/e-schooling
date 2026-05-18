import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { Subject } from '../../models/entities/academic/subject.entity';
import { ClassSectionSubject } from '../../models/entities/academic/class-section-subject.entity';
import { CreateClassDto } from '../../interfaces/request/academic/create-class.dto';
import { UpdateClassDto } from '../../interfaces/request/academic/update-class.dto';
import { CreateSectionDto } from '../../interfaces/request/academic/create-section.dto';
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
      const parentClass = await queryRunner.manager.findOne(Class, {
        where: { id: data.classId, schoolId, isDeleted: false },
      });
      if (parentClass && !parentClass.hasSections) {
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

  // MAPPINGS
  async assignSubjectToClassSection(schoolId: string, data: Partial<ClassSectionSubject>, userId: string) {
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
