import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { Subject } from '../../models/entities/academic/subject.entity';
import { ClassSectionSubject } from '../../models/entities/academic/class-section-subject.entity';
import { TeacherSectionAssignment } from '../../models/entities/academic/teacher-section-assignment.entity';
import { CreateClassDto } from '../../interfaces/request/academic/create-class.dto';
import { UpdateClassDto } from '../../interfaces/request/academic/update-class.dto';
import { CreateSectionDto } from '../../interfaces/request/academic/create-section.dto';
import { UpdateSectionDto } from '../../interfaces/request/academic/update-section.dto';
import { UpdateSubjectDto } from '../../interfaces/request/academic/update-subject.dto';
import { TransferStudentsDto } from '../../interfaces/request/academic/transfer-students.dto';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { SectionTransferHistory } from '../../models/entities/student/section-transfer-history.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { SchoolOwner } from '../../models/entities/school/school-owner.entity';
import { PlatformUser } from '../../models/entities/platform/platform-user.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';
import type { AuthContext } from '../../interfaces/auth-context.interface';

@Injectable()
export class AcademicService {
  private classRepo: Repository<Class>;
  private sectionRepo: Repository<Section>;
  private subjectRepo: Repository<Subject>;
  private mappingRepo: Repository<ClassSectionSubject>;
  private assignmentRepo: Repository<TeacherSectionAssignment>;

  constructor(private dataSource: DataSource) {
    this.classRepo = this.dataSource.getRepository(Class);
    this.sectionRepo = this.dataSource.getRepository(Section);
    this.subjectRepo = this.dataSource.getRepository(Subject);
    this.mappingRepo = this.dataSource.getRepository(ClassSectionSubject);
    this.assignmentRepo = this.dataSource.getRepository(
      TeacherSectionAssignment,
    );
  }

  private async checkModulePermission(
    caller: AuthContext,
    schoolId: string,
    moduleCode: string,
    requiredOperation: string,
  ): Promise<boolean> {
    if (caller.actorType === 'school_owner') return true;

    const userRoles = await this.dataSource.getRepository(SchoolUserRole).find({
      where: { userId: caller.id, isActive: true, isDeleted: false },
    });

    if (!userRoles.length) return false;
    const roleIds = userRoles.map((ur) => ur.roleId);

    const permission = await this.dataSource
      .getRepository(SchoolRolePermission)
      .createQueryBuilder('rp')
      .innerJoin(ModuleOperationPermission, 'p', 'p.id = rp.permissionId')
      .innerJoin(ModuleMaster, 'm', 'm.id = p.moduleId')
      .innerJoin(OperationMaster, 'o', 'o.id = p.operationId')
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .andWhere('LOWER(m.code) = LOWER(:moduleCode)', { moduleCode })
      .andWhere('LOWER(o.code) = LOWER(:requiredOperation)', {
        requiredOperation,
      })
      .andWhere('rp.isActive = true')
      .andWhere('rp.isDeleted = false')
      .andWhere('p.isActive = true')
      .andWhere('p.isDeleted = false')
      .andWhere('m.isActive = true')
      .andWhere('o.isActive = true')
      .getOne();

    return !!permission;
  }

  // ASSIGNMENTS HELPER
  private async upsertSectionTeacher(
    schoolId: string,
    classId: string,
    sectionId: string,
    teacherId: string | null, // null means unassign
    userId: string,
  ) {
    const existingAssignment = await this.assignmentRepo.findOne({
      where: { sectionId, schoolId, isClassTeacher: true, isDeleted: false },
    });

    if (teacherId) {
      if (existingAssignment) {
        existingAssignment.teacherId = teacherId;
        existingAssignment.isActive = true;
        existingAssignment.updatedById = userId;
        await this.assignmentRepo.save(existingAssignment);
      } else {
        const newAssignment = this.assignmentRepo.create({
          schoolId,
          classId,
          sectionId,
          teacherId,
          isClassTeacher: true,
          isActive: true,
          createdById: userId,
          updatedById: userId,
        });
        await this.assignmentRepo.save(newAssignment);
      }
    } else if (existingAssignment) {
      existingAssignment.isActive = false;
      existingAssignment.updatedById = userId;
      await this.assignmentRepo.save(existingAssignment);
    }
  }

  // CLASSES
  async createClass(schoolId: string, data: CreateClassDto, userId: string) {
    const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();

    if (data.classTeacherId) {
      const teacher = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: data.classTeacherId, schoolId, isDeleted: false },
      });
      if (!teacher) {
        throw new NotFoundException('Class teacher not found in this school');
      }
    }

    // Check if class with same normalized name exists in the school
    const existingClasses = await this.classRepo.find({ where: { schoolId } });
    const match = existingClasses.find(
      (c) => c.name.replace(/\s+/g, '').toLowerCase() === normalizedInput,
    );

    if (match) {
      if (match.isDeleted) {
        // Upsert: restore and make active
        match.isDeleted = false;
        match.isActive = true;
        match.name = data.name; // Keep input casing
        match.dailyAttendanceLimit =
          data.dailyAttendanceLimit ?? match.dailyAttendanceLimit;
        if (data.classCode !== undefined) match.classCode = data.classCode;
        if (data.description !== undefined)
          match.description = data.description;
        match.updatedById = userId;
        const saved = await this.classRepo.save(match);

        // Also check/restore the default section for this class
        const defaultSection = await this.sectionRepo.findOne({
          where: {
            classId: saved.id,
            schoolId,
            name: 'default',
            isDefault: true,
          },
        });
        let finalDefaultSectionId = defaultSection?.id;
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
          const savedSection = await this.sectionRepo.save(newDefaultSection);
          finalDefaultSectionId = savedSection.id;
        }

        if (data.classTeacherId !== undefined && finalDefaultSectionId) {
          await this.upsertSectionTeacher(
            schoolId,
            saved.id,
            finalDefaultSectionId,
            data.classTeacherId || null,
            userId,
          );
        }

        return saved;
      }

      if (!match.isActive) {
        throw new BadRequestException(
          'This class already exists with inactive status',
        );
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
    const newDefaultSection = this.sectionRepo.create({
      schoolId,
      classId: savedClass.id,
      name: 'default',
      isDefault: true,
      isActive: true,
      createdById: userId,
      updatedById: userId,
    });
    const savedDefaultSection = await this.sectionRepo.save(newDefaultSection);

    if (data.classTeacherId !== undefined) {
      await this.upsertSectionTeacher(
        schoolId,
        savedClass.id,
        savedDefaultSection.id,
        data.classTeacherId || null,
        userId,
      );
    }

    return savedClass;
  }

  async getClasses(schoolId: string) {
    return await this.classRepo.find({ where: { schoolId, isDeleted: false } });
  }

  async updateClass(
    schoolId: string,
    id: string,
    data: UpdateClassDto,
    userId: string,
  ) {
    const existing = await this.classRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Class not found');

    if (data.classTeacherId) {
      const teacher = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: data.classTeacherId, schoolId, isDeleted: false },
      });
      if (!teacher) {
        throw new NotFoundException('Class teacher not found in this school');
      }
    }

    if (data.name) {
      const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();
      const existingClasses = await this.classRepo.find({
        where: { schoolId },
      });
      const match = existingClasses.find(
        (c) =>
          c.id !== id &&
          c.name.replace(/\s+/g, '').toLowerCase() === normalizedInput,
      );

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
          match.dailyAttendanceLimit =
            data.dailyAttendanceLimit ?? match.dailyAttendanceLimit;
          if (data.classCode !== undefined) match.classCode = data.classCode;
          if (data.description !== undefined)
            match.description = data.description;
          match.updatedById = userId;
          const saved = await this.classRepo.save(match);

          // Restore default section if needed
          const defaultSection = await this.sectionRepo.findOne({
            where: {
              classId: saved.id,
              schoolId,
              name: 'default',
              isDefault: true,
            },
          });
          let finalDefaultSectionId = defaultSection?.id;
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
            const savedSection = await this.sectionRepo.save(newDefaultSection);
            finalDefaultSectionId = savedSection.id;
          }

          if (data.classTeacherId !== undefined && finalDefaultSectionId) {
            await this.upsertSectionTeacher(
              schoolId,
              saved.id,
              finalDefaultSectionId,
              data.classTeacherId || null,
              userId,
            );
          }

          return saved;
        }

        if (!match.isActive) {
          throw new BadRequestException(
            'This class already exists with inactive status',
          );
        }

        throw new BadRequestException('This class already exists');
      }
    }

    const { classTeacherId, ...updateData } = data;
    Object.assign(existing, { ...updateData, updatedById: userId });
    const savedClass = await this.classRepo.save(existing);

    if (classTeacherId !== undefined) {
      // Find the default section to assign the teacher
      const defaultSection = await this.sectionRepo.findOne({
        where: {
          classId: existing.id,
          schoolId,
          name: 'default',
          isDefault: true,
        },
      });
      if (defaultSection) {
        await this.upsertSectionTeacher(
          schoolId,
          existing.id,
          defaultSection.id,
          classTeacherId || null,
          userId,
        );
      }
    }
    return savedClass;
  }

  async getClassDetails(
    schoolId: string,
    classId: string,
    caller: AuthContext,
  ) {
    const cls = await this.classRepo.findOne({
      where: { id: classId, schoolId, isDeleted: false },
    });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    // Resolve creator's name
    let createdByName = 'System';
    if (cls.createdById) {
      // Try SchoolUser
      const user = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: cls.createdById },
      });
      if (user) {
        createdByName = user.name;
      } else {
        // Try SchoolOwner
        const owner = await this.dataSource.getRepository(SchoolOwner).findOne({
          where: { id: cls.createdById },
        });
        if (owner) {
          createdByName = owner.fullName;
        } else {
          // Try PlatformUser
          const platformUser = await this.dataSource
            .getRepository(PlatformUser)
            .findOne({
              where: { id: cls.createdById },
            });
          if (platformUser) {
            createdByName = platformUser.name;
          }
        }
      }
    }

    // Resolve updater's name
    let updatedByName = 'System';
    if (cls.updatedById) {
      // Try SchoolUser
      const user = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: cls.updatedById },
      });
      if (user) {
        updatedByName = user.name;
      } else {
        // Try SchoolOwner
        const owner = await this.dataSource.getRepository(SchoolOwner).findOne({
          where: { id: cls.updatedById },
        });
        if (owner) {
          updatedByName = owner.fullName;
        } else {
          // Try PlatformUser
          const platformUser = await this.dataSource
            .getRepository(PlatformUser)
            .findOne({
              where: { id: cls.updatedById },
            });
          if (platformUser) {
            updatedByName = platformUser.name;
          }
        }
      }
    }

    // Fetch active non-default sections allotted to this class
    const sections = await this.sectionRepo.find({
      where: { classId: cls.id, schoolId, isDefault: false, isDeleted: false },
      order: { name: 'ASC' },
    });

    // Fetch assignments for the sections and the default section
    const assignments = await this.assignmentRepo.find({
      where: {
        classId: cls.id,
        schoolId,
        isClassTeacher: true,
        isDeleted: false,
        isActive: true,
      },
      relations: ['teacher'],
    });

    let classTeacherId: string | null = null;
    let classTeacherName: string | null = null;

    if (!cls.hasSections) {
      const defaultSection = await this.sectionRepo.findOne({
        where: {
          classId: cls.id,
          schoolId,
          name: 'default',
          isDefault: true,
          isDeleted: false,
        },
      });
      if (defaultSection) {
        const assignment = assignments.find(
          (a) => a.sectionId === defaultSection.id,
        );
        if (assignment && assignment.teacher) {
          classTeacherId = assignment.teacherId;
          classTeacherName = assignment.teacher.name;
        }
      }
    }

    const hasSectionViewAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'sections',
      'view',
    );

    return {
      id: cls.id,
      schoolId: cls.schoolId,
      name: cls.name,
      classCode: cls.classCode || null,
      description: cls.description || null,
      classTeacherId,
      classTeacherName,
      dailyAttendanceLimit: cls.dailyAttendanceLimit,
      hasSections: cls.hasSections,
      isActive: cls.isActive,
      createdById: cls.createdById,
      createdBy: createdByName,
      updatedById: cls.updatedById,
      updatedBy: updatedByName,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      sections: hasSectionViewAccess
        ? sections.map((s) => {
            const assignment = assignments.find((a) => a.sectionId === s.id);
            return {
              id: s.id,
              name: s.name,
              capacity: s.capacity || null,
              isDefault: s.isDefault,
              isActive: s.isActive,
              classTeacherId: assignment ? assignment.teacherId : null,
              classTeacherName: assignment?.teacher
                ? assignment.teacher.name
                : null,
            };
          })
        : [],
      sectionCount: sections.length,
      sectionMessage: hasSectionViewAccess
        ? undefined
        : 'You do not have permission to view sections for this class.',
    };
  }

  // SECTIONS
  async createSection(
    schoolId: string,
    data: CreateSectionDto,
    userId: string,
  ) {
    // 1. Validate that the class exists and belongs to the same school
    const parentClass = await this.classRepo.findOne({
      where: { id: data.classId, schoolId, isDeleted: false },
    });
    if (!parentClass) {
      throw new NotFoundException('Class not found');
    }

    if (data.classTeacherId) {
      const teacher = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: data.classTeacherId, schoolId, isDeleted: false },
      });
      if (!teacher) {
        throw new NotFoundException('Section teacher not found in this school');
      }
    }

    const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();

    // 2. Validate section name uniqueness in the same class and school
    const existingSections = await this.sectionRepo.find({
      where: { schoolId, classId: data.classId },
    });
    const match = existingSections.find(
      (s) => s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput,
    );

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
          where: {
            classId: data.classId,
            schoolId,
            name: 'default',
            isDefault: true,
            isDeleted: false,
          },
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
        throw new BadRequestException(
          'This section already exists with inactive status',
        );
      }

      throw new BadRequestException(
        'This section already exists in this class',
      );
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

      if (data.classTeacherId !== undefined) {
        if (data.classTeacherId) {
          const newAssignment = queryRunner.manager.create(
            TeacherSectionAssignment,
            {
              schoolId,
              classId: data.classId,
              sectionId: savedSection.id,
              teacherId: data.classTeacherId,
              isClassTeacher: true,
              isActive: true,
              createdById: userId,
              updatedById: userId,
            },
          );
          await queryRunner.manager.save(
            TeacherSectionAssignment,
            newAssignment,
          );
        }
      }

      if (defaultSection) {
        // Soft-delete the default section
        defaultSection.isDeleted = true;
        defaultSection.isActive = false;
        defaultSection.updatedById = userId;
        await queryRunner.manager.save(Section, defaultSection);

        // Find all student enrollments that were assigned to the default section
        const defaultEnrollments = await queryRunner.manager.find(
          StudentEnrollment,
          {
            where: {
              schoolId,
              classId: data.classId,
              sectionId: defaultSection.id,
              isDeleted: false,
              isActive: true,
            },
          },
        );

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
            },
          );

          // 2. Insert audited section transfer histories
          const transferHistories = defaultEnrollments.map((enrollment) => {
            return queryRunner.manager.create(SectionTransferHistory, {
              schoolId,
              studentEnrollmentId: enrollment.id,
              oldSectionId: defaultSection.id,
              newSectionId: savedSection.id,
              reason:
                'Automatic migration from default section during custom section creation',
              changedBy: userId,
              changedAt: new Date(),
              isActive: true,
              isDeleted: false,
            });
          });
          await queryRunner.manager.save(
            SectionTransferHistory,
            transferHistories,
          );
          migratedCount = defaultEnrollments.length;
        }
      }

      await queryRunner.commitTransaction();

      return {
        ...savedSection,
        migrationMeta:
          migratedCount > 0
            ? {
                migratedCount,
                message: `Since this class previously had no sections, all ${migratedCount} active student(s) have been automatically migrated to this newly created section (${savedSection.name}) so they remain active.`,
              }
            : null,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSections(schoolId: string, classId?: string) {
    const where: any = { schoolId, isDefault: false, isDeleted: false };
    if (classId) where.classId = classId;
    const sections = await this.sectionRepo.find({ where });

    const sectionIds = sections.map((s) => s.id);
    let assignments: TeacherSectionAssignment[] = [];
    if (sectionIds.length > 0) {
      assignments = await this.assignmentRepo.find({
        where: {
          sectionId: In(sectionIds),
          isClassTeacher: true,
          isDeleted: false,
          isActive: true,
        },
        relations: ['teacher'],
      });
    }

    return sections.map((s) => {
      const assignment = assignments.find((a) => a.sectionId === s.id);
      return {
        ...s,
        classTeacherId: assignment ? assignment.teacherId : null,
        classTeacherName: assignment?.teacher ? assignment.teacher.name : null,
      };
    });
  }

  async updateSection(
    schoolId: string,
    id: string,
    data: UpdateSectionDto,
    userId: string,
  ) {
    const existing = await this.sectionRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Section not found');

    if (data.classTeacherId) {
      const teacher = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: data.classTeacherId, schoolId, isDeleted: false },
      });
      if (!teacher) {
        throw new NotFoundException('Section teacher not found in this school');
      }
    }

    if (data.name) {
      const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();
      const existingSections = await this.sectionRepo.find({
        where: { schoolId, classId: existing.classId },
      });
      const match = existingSections.find(
        (s) =>
          s.id !== id &&
          s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput,
      );

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
          if (data.capacity !== undefined) match.capacity = data.capacity;
          match.updatedById = userId;
          const savedSection = await this.sectionRepo.save(match);

          if (data.classTeacherId !== undefined) {
            await this.upsertSectionTeacher(
              schoolId,
              existing.classId,
              savedSection.id,
              data.classTeacherId || null,
              userId,
            );
          }
          return savedSection;
        }

        if (!match.isActive) {
          throw new BadRequestException(
            'This section already exists with inactive status',
          );
        }

        throw new BadRequestException(
          'This section already exists in this class',
        );
      }
    }

    const { classTeacherId, ...updateData } = data;
    Object.assign(existing, { ...updateData, updatedById: userId });
    const savedSection = await this.sectionRepo.save(existing);

    if (classTeacherId !== undefined) {
      await this.upsertSectionTeacher(
        schoolId,
        existing.classId,
        existing.id,
        classTeacherId || null,
        userId,
      );
    }
    return savedSection;
  }

  async transferStudents(
    schoolId: string,
    dto: TransferStudentsDto,
    userId: string,
  ) {
    const { studentEnrollmentIds, targetSectionId, reason } = dto;

    const targetSection = await this.sectionRepo.findOne({
      where: {
        id: targetSectionId,
        schoolId,
        isDeleted: false,
        isActive: true,
      },
    });
    if (!targetSection) {
      throw new NotFoundException('Target section not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const enrollmentId of studentEnrollmentIds) {
        const enrollment = await queryRunner.manager.findOne(
          StudentEnrollment,
          {
            where: {
              id: enrollmentId,
              schoolId,
              isDeleted: false,
              isActive: true,
            },
          },
        );

        if (!enrollment) {
          throw new NotFoundException(
            `Student enrollment with ID ${enrollmentId} not found`,
          );
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
      return {
        message: 'Students transferred successfully',
        count: studentEnrollmentIds.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // SUBJECTS
  async createSubject(
    schoolId: string,
    data: Partial<Subject>,
    userId: string,
  ) {
    if (!data.name) {
      throw new BadRequestException('Subject name is required');
    }

    const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();

    // Check if subject with same normalized name exists in the school
    const existingSubjects = await this.subjectRepo.find({
      where: { schoolId },
    });
    const match = existingSubjects.find(
      (s) => s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput,
    );

    if (match) {
      if (match.isDeleted) {
        match.isDeleted = false;
        match.isActive = true;
        match.name = data.name;
        match.updatedById = userId;
        return await this.subjectRepo.save(match);
      }

      if (!match.isActive) {
        throw new BadRequestException(
          'This subject already exists with inactive status',
        );
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
    return await this.subjectRepo.find({
      where: { schoolId, isDeleted: false },
    });
  }

  async updateSubject(
    schoolId: string,
    id: string,
    data: UpdateSubjectDto,
    userId: string,
  ) {
    const existing = await this.subjectRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Subject not found');

    if (data.name) {
      const normalizedInput = data.name.replace(/\s+/g, '').toLowerCase();
      const existingSubjects = await this.subjectRepo.find({
        where: { schoolId },
      });
      const match = existingSubjects.find(
        (s) =>
          s.id !== id &&
          s.name.replace(/\s+/g, '').toLowerCase() === normalizedInput,
      );

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
          throw new BadRequestException(
            'This subject already exists with inactive status',
          );
        }

        throw new BadRequestException('This subject already exists');
      }
    }

    Object.assign(existing, { ...data, updatedById: userId });
    return await this.subjectRepo.save(existing);
  }

  // MAPPINGS
  async assignSubjectToClassSection(
    schoolId: string,
    data: Partial<ClassSectionSubject>,
    userId: string,
  ) {
    const { classId, sectionId, subjectId } = data;

    if (!classId || !sectionId || !subjectId) {
      throw new BadRequestException(
        'classId, sectionId, and subjectId are required',
      );
    }

    // 1. Validate existence of class, section, subject in the school
    const cls = await this.classRepo.findOne({
      where: { id: classId, schoolId, isDeleted: false },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const sec = await this.sectionRepo.findOne({
      where: { id: sectionId, classId, schoolId, isDeleted: false },
    });
    if (!sec) throw new NotFoundException('Section not found');

    const sub = await this.subjectRepo.findOne({
      where: { id: subjectId, schoolId, isDeleted: false },
    });
    if (!sub) throw new NotFoundException('Subject not found');

    // 2. Validate uniqueness of the mapping
    const existing = await this.mappingRepo.findOne({
      where: { schoolId, classId, sectionId, subjectId },
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
        throw new BadRequestException(
          'This subject mapping already exists with inactive status',
        );
      }

      throw new BadRequestException(
        'This subject is already mapped to this class and section',
      );
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
    return await this.mappingRepo.find({
      where,
      relations: ['class', 'section', 'subject'],
    });
  }
}
