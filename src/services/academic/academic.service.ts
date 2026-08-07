import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import type { AuthContext } from '../../interfaces/auth-context.interface';
import { AllocateRoomDto } from '../../interfaces/request/academic/allocate-room.dto';
import { CopyAcademicSessionDataDto } from '../../interfaces/request/academic/copy-academic-session-data.dto';
import { CreateAcademicSessionDto } from '../../interfaces/request/academic/create-academic-session.dto';
import { CreateClassDto } from '../../interfaces/request/academic/create-class.dto';
import { CreateRoomDto } from '../../interfaces/request/academic/create-room.dto';
import { CreateSectionDto } from '../../interfaces/request/academic/create-section.dto';
import { TransferStudentsDto } from '../../interfaces/request/academic/transfer-students.dto';
import { UpdateAcademicSessionDto } from '../../interfaces/request/academic/update-academic-session.dto';
import { UpdateClassDto } from '../../interfaces/request/academic/update-class.dto';
import { UpdateRoomDto } from '../../interfaces/request/academic/update-room.dto';
import { UpdateSectionDto } from '../../interfaces/request/academic/update-section.dto';
import { UpdateSubjectDto } from '../../interfaces/request/academic/update-subject.dto';
import { AcademicSession } from '../../models/entities/academic/academic-session.entity';
import { ClassSectionSubject } from '../../models/entities/academic/class-section-subject.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { Room } from '../../models/entities/academic/room.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { Subject } from '../../models/entities/academic/subject.entity';
import { TeacherSectionAssignment } from '../../models/entities/academic/teacher-section-assignment.entity';
import { PlatformUser } from '../../models/entities/platform/platform-user.entity';
import { ModuleMaster } from '../../models/entities/rbac/module-master.entity';
import { ModuleOperationPermission } from '../../models/entities/rbac/module-operation-permission.entity';
import { OperationMaster } from '../../models/entities/rbac/operation-master.entity';
import { SchoolRolePermission } from '../../models/entities/rbac/school-role-permission.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { SchoolOwner } from '../../models/entities/school/school-owner.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { SectionTransferHistory } from '../../models/entities/student/section-transfer-history.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import {
  EnrollmentStatusEnum,
  EnrollmentTypeEnum,
} from '../../models/enums/enums';

@Injectable()
export class AcademicService implements OnModuleInit {
  private classRepo: Repository<Class>;
  private sectionRepo: Repository<Section>;
  private subjectRepo: Repository<Subject>;
  private mappingRepo: Repository<ClassSectionSubject>;
  private assignmentRepo: Repository<TeacherSectionAssignment>;
  private sessionRepo: Repository<AcademicSession>;
  private roomRepo: Repository<Room>;

  constructor(private dataSource: DataSource) {
    this.classRepo = this.dataSource.getRepository(Class);
    this.sectionRepo = this.dataSource.getRepository(Section);
    this.subjectRepo = this.dataSource.getRepository(Subject);
    this.mappingRepo = this.dataSource.getRepository(ClassSectionSubject);
    this.assignmentRepo = this.dataSource.getRepository(
      TeacherSectionAssignment,
    );
    this.sessionRepo = this.dataSource.getRepository(AcademicSession);
    this.roomRepo = this.dataSource.getRepository(Room);
  }

  async onModuleInit() {
    try {
      const tables = [
        'classes',
        'sections',
        'class_section_subjects',
        'subjects',
        'teacher_section_assignments',
        'rooms',
        'student_subjects',
      ];
      for (const table of tables) {
        await this.dataSource.query(
          `ALTER TABLE "e_schooling"."${table}" ADD COLUMN IF NOT EXISTS "academic_session_id" bigint;`,
        );
      }
      await this.dataSource.query(
        `ALTER TABLE "e_schooling"."classes" ADD COLUMN IF NOT EXISTS "capacity" integer DEFAULT 40;`,
      );
    } catch (err) {
      console.warn(
        'Auto-column creation for academic_session_id/capacity skipped:',
        err,
      );
    }
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
      .andWhere('rp.is_delete = false')
      .andWhere('p.isActive = true')
      .andWhere('p.is_delete = false')
      .andWhere('m.isActive = true')
      .andWhere('o.isActive = true')
      .getOne();

    return !!permission;
  }

  private async getAssignedClassesAndSections(
    schoolId: string,
    callerId: string,
  ): Promise<{ classIds: string[]; sectionIds: string[] }> {
    const assignments = await this.assignmentRepo.find({
      where: {
        teacherId: callerId,
        schoolId,
        isActive: true,
        isDeleted: false,
      },
    });

    const classIds = [...new Set(assignments.map((a) => a.classId))];
    const sectionIds = [
      ...new Set(
        assignments
          .filter((a) => a.sectionId !== null)
          .map((a) => a.sectionId as string),
      ),
    ];

    return { classIds, sectionIds };
  }

  // ASSIGNMENTS HELPER
  private async upsertClassTeacher(
    schoolId: string,
    classId: string,
    teacherId: string | null,
    userId: string,
  ) {
    const existingAssignment = await this.assignmentRepo.findOne({
      where: {
        classId,
        schoolId,
        sectionId: IsNull(),
        isClassTeacher: true,
        isDeleted: false,
      },
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
          sectionId: null,
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

  private async upsertSectionTeacher(
    schoolId: string,
    classId: string,
    sectionId: string,
    teacherId: string | null, // null means unassign
    userId: string,
  ) {
    const existingAssignment = await this.assignmentRepo.findOne({
      where: { sectionId, schoolId, isClassTeacher: false, isDeleted: false },
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
          isClassTeacher: false,
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
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Class name is required.');
    }
    const name = data.name.trim().replace(/[<>]/g, '');
    if (name.length < 2 || name.length > 100) {
      throw new BadRequestException(
        'Class name must be between 2 and 100 characters long.',
      );
    }
    if (/\s{2,}/.test(data.name)) {
      throw new BadRequestException(
        'Multiple consecutive spaces are not allowed in class name.',
      );
    }
    data.name = name;

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

        if (data.classTeacherId !== undefined) {
          await this.upsertClassTeacher(
            schoolId,
            saved.id,
            data.classTeacherId || null,
            userId,
          );
          const activeSections = await this.sectionRepo.find({
            where: {
              classId: saved.id,
              schoolId,
              isDeleted: false,
              isActive: true,
            },
          });
          const hasOnlyDefaultSection =
            activeSections.length === 1 && activeSections[0].isDefault;
          if (finalDefaultSectionId && hasOnlyDefaultSection) {
            await this.upsertSectionTeacher(
              schoolId,
              saved.id,
              finalDefaultSectionId,
              data.classTeacherId || null,
              userId,
            );
          }
        }

        return {
          ...saved,
          defaultSection,
        };
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
      academicSessionId: data.academicSessionId || null,
      createdById: userId,
      updatedById: userId,
    });
    const savedClass = await this.classRepo.save(newClass);

    // Automatically create a default section since hasSections is false
    const newDefaultSection = this.sectionRepo.create({
      schoolId,
      academicSessionId: data.academicSessionId || null,
      classId: savedClass.id,
      name: 'default',
      isDefault: true,
      isActive: true,
      createdById: userId,
      updatedById: userId,
    });
    const savedDefaultSection = await this.sectionRepo.save(newDefaultSection);

    if (data.classTeacherId !== undefined) {
      await this.upsertClassTeacher(
        schoolId,
        savedClass.id,
        data.classTeacherId || null,
        userId,
      );
      await this.upsertSectionTeacher(
        schoolId,
        savedClass.id,
        savedDefaultSection.id,
        data.classTeacherId || null,
        userId,
      );
    }

    return {
      ...savedClass,
      defaultSection: savedDefaultSection,
    };
  }

  async getClasses(
    schoolId: string,
    caller?: AuthContext,
    academicSessionId?: string,
  ) {
    let classes = await this.classRepo.find({
      where: { schoolId, isDeleted: false },
      order: { createdAt: 'ASC' },
    });

    if (academicSessionId) {
      classes = classes.filter(
        (cls) =>
          cls.academicSessionId === String(academicSessionId) ||
          cls.academicSessionId === null,
      );
    }

    if (classes.length === 0) return [];

    // Filter by assigned classes if caller is not owner and only has view_assigned permission
    if (caller && caller.actorType !== 'school_owner') {
      const hasFullView = await this.checkModulePermission(
        caller,
        schoolId,
        'classes',
        'view',
      );
      if (!hasFullView) {
        const hasViewAssigned = await this.checkModulePermission(
          caller,
          schoolId,
          'classes',
          'view_assigned',
        );
        if (hasViewAssigned) {
          const { classIds } = await this.getAssignedClassesAndSections(
            schoolId,
            caller.id,
          );
          classes = classes.filter((cls) => classIds.includes(cls.id));
        } else {
          return [];
        }
      }
    }

    if (classes.length === 0) return [];

    // Query sections counts grouped by classId
    const sectionCounts = await this.sectionRepo
      .createQueryBuilder('section')
      .select('section.class_id', 'classId')
      .addSelect('COUNT(section.id)', 'count')
      .where('section.school_id = :schoolId', { schoolId: String(schoolId) })
      .andWhere('section.is_delete = false')
      .groupBy('section.class_id')
      .getRawMany<{ classId: string; count: string }>();

    // Query active student enrollments counts grouped by classId
    const studentCountQb = this.dataSource
      .getRepository(StudentEnrollment)
      .createQueryBuilder('enrollment')
      .select('enrollment.class_id', 'classId')
      .addSelect('COUNT(enrollment.id)', 'count')
      .where('enrollment.school_id = :schoolId', { schoolId: String(schoolId) })
      .andWhere('enrollment.is_current = true')
      .andWhere('enrollment.is_active = true')
      .andWhere('enrollment.is_delete = false');

    if (academicSessionId) {
      studentCountQb.andWhere(
        'enrollment.academic_session_id = :academicSessionId',
        { academicSessionId: String(academicSessionId) },
      );
    }

    const studentCounts = await studentCountQb
      .groupBy('enrollment.class_id')
      .getRawMany<{ classId: string; count: string }>();

    const sectionCountMap = new Map<string, number>();
    sectionCounts.forEach((sc: { classId: string; count: string }) => {
      sectionCountMap.set(sc.classId, parseInt(sc.count, 10));
    });

    const studentCountMap = new Map<string, number>();
    studentCounts.forEach((sc: { classId: string; count: string }) => {
      studentCountMap.set(sc.classId, parseInt(sc.count, 10));
    });

    // Fetch teacher assignments for the school (class-level)
    const assignments = await this.assignmentRepo.find({
      where: {
        schoolId,
        sectionId: IsNull(),
        isClassTeacher: true,
        isActive: true,
        isDeleted: false,
      },
      relations: ['teacher'],
    });

    return classes.map((cls) => {
      const sCount = sectionCountMap.get(cls.id) || 0;
      const stCount = studentCountMap.get(cls.id) || 0;

      let classTeacherId: string | null = null;
      let classTeacherName: string | null = null;

      const assignment = assignments.find((a) => a.classId === cls.id);
      if (assignment && assignment.teacher) {
        classTeacherId = assignment.teacherId;
        classTeacherName = assignment.teacher.name;
      }

      return {
        ...cls,
        code: cls.classCode,
        sectionsCount: sCount,
        sectionCount: sCount,
        studentsCount: stCount,
        classTeacherId,
        classTeacherName,
      };
    });
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

          if (data.classTeacherId !== undefined) {
            await this.upsertClassTeacher(
              schoolId,
              saved.id,
              data.classTeacherId || null,
              userId,
            );
            const activeSections = await this.sectionRepo.find({
              where: {
                classId: saved.id,
                schoolId,
                isDeleted: false,
                isActive: true,
              },
            });
            const hasOnlyDefaultSection =
              activeSections.length === 1 && activeSections[0].isDefault;
            if (finalDefaultSectionId && hasOnlyDefaultSection) {
              await this.upsertSectionTeacher(
                schoolId,
                saved.id,
                finalDefaultSectionId,
                data.classTeacherId || null,
                userId,
              );
            }
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
      await this.upsertClassTeacher(
        schoolId,
        existing.id,
        classTeacherId || null,
        userId,
      );
      const activeSections = await this.sectionRepo.find({
        where: {
          classId: existing.id,
          schoolId,
          isDeleted: false,
          isActive: true,
        },
      });
      const hasOnlyDefaultSection =
        activeSections.length === 1 && activeSections[0].isDefault;
      if (hasOnlyDefaultSection) {
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
    }
    return savedClass;
  }

  async deleteClass(schoolId: string, id: string, userId: string) {
    const existing = await this.classRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Class not found');

    // Soft-delete the class
    existing.isDeleted = true;
    existing.isActive = false;
    existing.updatedById = userId;
    await this.classRepo.save(existing);

    // Also soft-delete all sections in this class
    const sections = await this.sectionRepo.find({
      where: { classId: id, schoolId, isDeleted: false },
    });
    for (const section of sections) {
      section.isDeleted = true;
      section.isActive = false;
      section.updatedById = userId;
      await this.sectionRepo.save(section);
    }

    return {
      success: true,
      message: 'Class deleted and unlinked all sections',
    };
  }

  async assignClassTeacher(
    schoolId: string,
    classId: string,
    teacherId: string | null,
    userId: string,
  ) {
    const cls = await this.classRepo.findOne({
      where: { id: classId, schoolId, isDeleted: false },
    });
    if (!cls) throw new NotFoundException('Class not found');

    await this.upsertClassTeacher(schoolId, classId, teacherId, userId);
    return { success: true, teacherId };
  }

  async assignSectionTeacher(
    schoolId: string,
    sectionId: string,
    teacherId: string | null,
    userId: string,
  ) {
    const sec = await this.sectionRepo.findOne({
      where: { id: sectionId, schoolId, isDeleted: false },
    });
    if (!sec) throw new NotFoundException('Section not found');

    await this.upsertSectionTeacher(
      schoolId,
      sec.classId,
      sectionId,
      teacherId,
      userId,
    );
    return { success: true, teacherId };
  }

  async getClassDetails(
    schoolId: string,
    classId: string,
    caller: AuthContext,
  ) {
    // Check permission restriction
    if (caller.actorType !== 'school_owner') {
      const hasFullView = await this.checkModulePermission(
        caller,
        schoolId,
        'classes',
        'view',
      );
      if (!hasFullView) {
        const hasViewAssigned = await this.checkModulePermission(
          caller,
          schoolId,
          'classes',
          'view_assigned',
        );
        if (hasViewAssigned) {
          const { classIds } = await this.getAssignedClassesAndSections(
            schoolId,
            caller.id,
          );
          if (!classIds.includes(classId)) {
            throw new ForbiddenException('Access to this class is denied');
          }
        } else {
          throw new ForbiddenException('Access to class details is denied');
        }
      }
    }

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

    // Fetch sections allotted to this class (including inactive, excluding soft-deleted)
    const sections = await this.sectionRepo.find({
      where: { classId: cls.id, schoolId, isDeleted: false },
      order: { name: 'ASC' },
    });

    // Fetch assignments for the class and its sections
    const assignments = await this.assignmentRepo.find({
      where: {
        classId: cls.id,
        schoolId,
        isDeleted: false,
        isActive: true,
      },
      relations: ['teacher'],
    });

    let classTeacherId: string | null = null;
    let classTeacherName: string | null = null;

    const classTeacherAssignment = assignments.find(
      (a) => a.sectionId === null && a.isClassTeacher === true,
    );
    if (classTeacherAssignment && classTeacherAssignment.teacher) {
      classTeacherId = classTeacherAssignment.teacherId;
      classTeacherName = classTeacherAssignment.teacher.name;
    }

    // Check permissions for nested modules
    const hasSectionViewAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'sections',
      'view',
    );
    let hasSectionViewAssigned = false;
    if (!hasSectionViewAccess) {
      hasSectionViewAssigned = await this.checkModulePermission(
        caller,
        schoolId,
        'sections',
        'view_assigned',
      );
    }

    const hasStudentsViewAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'students',
      'view',
    );
    const hasTimetableAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'timetable',
      'view',
    );
    const hasFeesAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'fees',
      'view',
    );

    let displaySections = sections;
    if (!hasSectionViewAccess && hasSectionViewAssigned) {
      const { sectionIds } = await this.getAssignedClassesAndSections(
        schoolId,
        caller.id,
      );
      displaySections = sections.filter((s) => sectionIds.includes(s.id));
    }

    const studentCount = hasStudentsViewAccess
      ? await this.dataSource.getRepository(StudentEnrollment).count({
          where: {
            schoolId,
            classId: cls.id,
            isCurrent: true,
            isActive: true,
            isDeleted: false,
          },
        })
      : null;

    const canViewSections = hasSectionViewAccess || hasSectionViewAssigned;

    return {
      id: cls.id,
      schoolId: cls.schoolId,
      name: cls.name,
      classCode: cls.classCode || null,
      description: cls.description || null,
      classTeacherId,
      classTeacherName,
      dailyAttendanceLimit: cls.dailyAttendanceLimit,
      isActive: cls.isActive,
      createdById: cls.createdById,
      createdBy: createdByName,
      updatedById: cls.updatedById,
      updatedBy: updatedByName,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,

      // Sections access
      sections: canViewSections
        ? displaySections.map((s) => {
            const assignment = assignments.find(
              (a) => a.sectionId === s.id && a.isClassTeacher === false,
            );
            return {
              id: s.id,
              name: s.name,
              capacity: s.capacity || null,
              room: s.room || null,
              isDefault: s.isDefault,
              isActive: s.isActive,
              sectionTeacherId: assignment ? assignment.teacherId : null,
              sectionTeacherName: assignment?.teacher
                ? assignment.teacher.name
                : null,
            };
          })
        : null,
      sectionCount: sections.length,
      sectionsAccess: canViewSections,
      sectionsMessage: canViewSections
        ? undefined
        : 'You do not have permission to view sections for this class.',

      // Students access
      studentsCount: studentCount,
      studentsAccess: hasStudentsViewAccess,
      studentsMessage: hasStudentsViewAccess
        ? undefined
        : 'You do not have permission to view student records for this class.',

      // Timetable access
      timetableAccess: hasTimetableAccess,
      timetableMessage: hasTimetableAccess
        ? undefined
        : 'You do not have permission to view timetable for this class.',

      // Fees access
      feesAccess: hasFeesAccess,
      feesMessage: hasFeesAccess
        ? undefined
        : 'You do not have permission to view fee structures for this class.',
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
        if (data.capacity !== undefined) match.capacity = data.capacity;
        if (data.room !== undefined) match.room = data.room;
        match.updatedById = userId;

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

      // Create new section
      const targetAcademicSessionId =
        data.academicSessionId || parentClass.academicSessionId || null;
      const section = queryRunner.manager.create(Section, {
        ...data,
        schoolId,
        academicSessionId: targetAcademicSessionId,
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
              academicSessionId: targetAcademicSessionId,
              classId: data.classId,
              sectionId: savedSection.id,
              teacherId: data.classTeacherId,
              isClassTeacher: false,
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

  async getSections(
    schoolId: string,
    caller?: AuthContext,
    classId?: string,
    academicSessionId?: string,
  ) {
    const where: FindOptionsWhere<Section> = { schoolId, isDeleted: false };
    if (classId) where.classId = classId;
    let sections = await this.sectionRepo.find({ where });

    if (academicSessionId) {
      sections = sections.filter(
        (s) =>
          s.academicSessionId === String(academicSessionId) ||
          s.academicSessionId === null,
      );
    }

    if (sections.length === 0) return [];

    // Filter by assigned sections if caller is not owner and only has view_assigned permission
    if (caller && caller.actorType !== 'school_owner') {
      const hasFullView = await this.checkModulePermission(
        caller,
        schoolId,
        'sections',
        'view',
      );
      if (!hasFullView) {
        const hasViewAssigned = await this.checkModulePermission(
          caller,
          schoolId,
          'sections',
          'view_assigned',
        );
        if (hasViewAssigned) {
          const { classIds, sectionIds } =
            await this.getAssignedClassesAndSections(schoolId, caller.id);
          sections = sections.filter(
            (s) => sectionIds.includes(s.id) || classIds.includes(s.classId),
          );
        } else {
          return [];
        }
      }
    }

    if (sections.length === 0) return [];

    const sectionIds = sections.map((s) => s.id);

    // Fetch assignments in parallel
    const assignmentsPromise = this.assignmentRepo.find({
      where: {
        sectionId: In(sectionIds),
        isClassTeacher: false,
        isDeleted: false,
        isActive: true,
      },
      relations: ['teacher'],
    });

    // Fetch active student counts for each section
    const studentCountsPromise = this.dataSource
      .getRepository(StudentEnrollment)
      .createQueryBuilder('enrollment')
      .select('enrollment.section_id', 'sectionId')
      .addSelect('COUNT(enrollment.id)', 'count')
      .where('enrollment.school_id = :schoolId', { schoolId })
      .andWhere('enrollment.section_id IN (:...sectionIds)', { sectionIds })
      .andWhere('enrollment.is_current = true')
      .andWhere('enrollment.is_active = true')
      .andWhere('enrollment.is_delete = false')
      .groupBy('enrollment.section_id')
      .getRawMany<{ sectionId: string; count: string }>();

    const [assignments, studentCounts] = await Promise.all([
      assignmentsPromise,
      studentCountsPromise,
    ]);

    const studentCountMap = new Map<string, number>();
    studentCounts.forEach((sc) => {
      studentCountMap.set(sc.sectionId, parseInt(sc.count, 10));
    });

    return sections.map((s) => {
      const assignment = assignments.find((a) => a.sectionId === s.id);
      const stCount = studentCountMap.get(s.id) || 0;
      return {
        ...s,
        status: s.isActive ? 'ACTIVE' : 'INACTIVE',
        sectionTeacherId: assignment ? assignment.teacherId : null,
        sectionTeacherName: assignment?.teacher
          ? assignment.teacher.name
          : null,
        classTeacherId: assignment ? assignment.teacherId : null,
        classTeacherName: assignment?.teacher ? assignment.teacher.name : null,
        studentsCount: stCount,
      };
    });
  }

  async getSectionDetails(
    schoolId: string,
    sectionId: string,
    caller: AuthContext,
  ) {
    const sec = await this.sectionRepo.findOne({
      where: { id: sectionId, schoolId, isDeleted: false },
      relations: ['class'],
    });
    if (!sec) {
      throw new NotFoundException('Section not found');
    }

    if (caller.actorType !== 'school_owner') {
      const hasFullView = await this.checkModulePermission(
        caller,
        schoolId,
        'sections',
        'view',
      );
      if (!hasFullView) {
        const hasViewAssigned = await this.checkModulePermission(
          caller,
          schoolId,
          'sections',
          'view_assigned',
        );
        if (hasViewAssigned) {
          const { classIds, sectionIds } =
            await this.getAssignedClassesAndSections(schoolId, caller.id);
          if (
            !sectionIds.includes(sectionId) &&
            !classIds.includes(sec.classId)
          ) {
            throw new ForbiddenException('Access to this section is denied');
          }
        } else {
          throw new ForbiddenException('Access to section details is denied');
        }
      }
    }

    const assignment = await this.assignmentRepo.findOne({
      where: {
        sectionId: sec.id,
        isClassTeacher: false,
        isDeleted: false,
        isActive: true,
      },
      relations: ['teacher'],
    });

    const hasStudentsViewAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'students',
      'view',
    );
    const hasTimetableAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'timetable',
      'view',
    );
    const hasFeesAccess = await this.checkModulePermission(
      caller,
      schoolId,
      'fees',
      'view',
    );

    const studentCount = hasStudentsViewAccess
      ? await this.dataSource.getRepository(StudentEnrollment).count({
          where: {
            schoolId,
            sectionId: sec.id,
            isCurrent: true,
            isActive: true,
            isDeleted: false,
          },
        })
      : null;

    return {
      id: sec.id,
      schoolId: sec.schoolId,
      classId: sec.classId,
      className: sec.class?.name || 'Class',
      name: sec.name,
      capacity: sec.capacity || 40,
      room: sec.room || null,
      isDefault: sec.isDefault,
      isActive: sec.isActive,
      status: sec.isActive ? 'ACTIVE' : 'INACTIVE',
      sectionTeacherId: assignment ? assignment.teacherId : null,
      sectionTeacherName: assignment?.teacher ? assignment.teacher.name : null,
      classTeacherId: assignment ? assignment.teacherId : null,
      classTeacherName: assignment?.teacher ? assignment.teacher.name : null,
      createdAt: sec.createdAt,
      updatedAt: sec.updatedAt,

      // Students access
      studentsCount: studentCount,
      studentsAccess: hasStudentsViewAccess,
      studentsMessage: hasStudentsViewAccess
        ? undefined
        : 'You do not have permission to view student records for this section.',

      // Timetable access
      timetableAccess: hasTimetableAccess,
      timetableMessage: hasTimetableAccess
        ? undefined
        : 'You do not have permission to view timetable for this section.',

      // Fees access
      feesAccess: hasFeesAccess,
      feesMessage: hasFeesAccess
        ? undefined
        : 'You do not have permission to view fee structures for this section.',
    };
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

    if (existing.isDefault && data.isActive === false) {
      throw new BadRequestException('Cannot deactivate the default section');
    }

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
          if (data.room !== undefined) match.room = data.room;
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

  async deleteSection(schoolId: string, id: string, userId: string) {
    const existing = await this.sectionRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Section not found');

    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default section of a class',
      );
    }

    existing.isDeleted = true;
    existing.isActive = false;
    existing.updatedById = userId;
    await this.sectionRepo.save(existing);

    return { success: true, message: 'Section deleted successfully' };
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

  async getSubjects(schoolId: string, academicSessionId?: string) {
    let subjects = await this.subjectRepo.find({
      where: { schoolId, isDeleted: false },
    });
    if (academicSessionId) {
      subjects = subjects.filter(
        (s) =>
          s.academicSessionId === String(academicSessionId) ||
          s.academicSessionId === null,
      );
    }
    return subjects;
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
      academicSessionId:
        data.academicSessionId || cls.academicSessionId || null,
      createdById: userId,
      updatedById: userId,
    });
    return await this.mappingRepo.save(mapping);
  }

  async removeSubjectFromClassSection(
    schoolId: string,
    classId: string,
    sectionId: string,
    subjectId: string,
  ) {
    const mapping = await this.mappingRepo.findOne({
      where: { schoolId, classId, sectionId, subjectId, isDeleted: false },
    });
    if (mapping) {
      mapping.isDeleted = true;
      return await this.mappingRepo.save(mapping);
    }
  }

  async getMappings(
    schoolId: string,
    classId?: string,
    sectionId?: string,
    academicSessionId?: string,
  ) {
    const where: FindOptionsWhere<ClassSectionSubject> = {
      schoolId,
      isDeleted: false,
    };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    let mappings = await this.mappingRepo.find({
      where,
      relations: ['class', 'section', 'subject'],
    });

    if (academicSessionId) {
      mappings = mappings.filter(
        (m) =>
          m.academicSessionId === String(academicSessionId) ||
          m.academicSessionId === null,
      );
    }
    return mappings;
  }

  // ACADEMIC SESSIONS CRUD
  async createAcademicSession(
    schoolId: string,
    dto: CreateAcademicSessionDto,
    userId: string,
  ) {
    // Check duplicate name for the school
    const normalizedName = dto.name.replace(/\s+/g, '').toLowerCase();
    const existingSessions = await this.sessionRepo.find({
      where: { schoolId, isDeleted: false },
    });
    const match = existingSessions.find(
      (s) => s.name.replace(/\s+/g, '').toLowerCase() === normalizedName,
    );
    if (match) {
      throw new BadRequestException(
        `Academic session '${dto.name}' already exists for this school`,
      );
    }

    // If marked as current or if this is the first session, unset isCurrent on all existing
    const isFirstSession = existingSessions.length === 0;
    const shouldBeCurrent = dto.isCurrent ?? isFirstSession;

    if (shouldBeCurrent) {
      await this.sessionRepo.update(
        { schoolId, isDeleted: false },
        { isCurrent: false },
      );
    }

    const session = this.sessionRepo.create({
      schoolId,
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isCurrent: shouldBeCurrent,
      isActive: dto.isActive !== false,
      isDeleted: false,
      createdById: userId,
      updatedById: userId,
    });

    return await this.sessionRepo.save(session);
  }

  async getAcademicSessions(schoolId: string) {
    return await this.sessionRepo.find({
      where: { schoolId, isDeleted: false },
      order: { startDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async getAcademicSessionDetails(schoolId: string, id: string) {
    const session = await this.sessionRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!session) {
      throw new NotFoundException('Academic session not found');
    }
    return session;
  }

  async updateAcademicSession(
    schoolId: string,
    id: string,
    dto: UpdateAcademicSessionDto,
    userId: string,
  ) {
    const session = await this.sessionRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!session) {
      throw new NotFoundException('Academic session not found');
    }

    if (dto.name && dto.name !== session.name) {
      const normalizedName = dto.name.replace(/\s+/g, '').toLowerCase();
      const existingSessions = await this.sessionRepo.find({
        where: { schoolId, isDeleted: false },
      });
      const match = existingSessions.find(
        (s) =>
          s.id !== id &&
          s.name.replace(/\s+/g, '').toLowerCase() === normalizedName,
      );
      if (match) {
        throw new BadRequestException(
          `Academic session '${dto.name}' already exists for this school`,
        );
      }
    }

    if (dto.isCurrent === true) {
      await this.sessionRepo.update(
        { schoolId, isDeleted: false },
        { isCurrent: false },
      );
    }

    Object.assign(session, {
      ...dto,
      updatedById: userId,
    });

    return await this.sessionRepo.save(session);
  }

  async deleteAcademicSession(schoolId: string, id: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!session) {
      throw new NotFoundException('Academic session not found');
    }

    if (session.isCurrent) {
      throw new BadRequestException(
        'Cannot delete the current active academic session. Please set another session as current first.',
      );
    }

    session.isDeleted = true;
    session.isActive = false;
    session.updatedById = userId;
    await this.sessionRepo.save(session);

    return {
      success: true,
      message: 'Academic session deleted successfully',
    };
  }

  async setAsCurrentAcademicSession(
    schoolId: string,
    id: string,
    userId: string,
  ) {
    const session = await this.sessionRepo.findOne({
      where: { id, schoolId, isDeleted: false },
    });
    if (!session) {
      throw new NotFoundException('Academic session not found');
    }

    // Unset all other sessions
    await this.sessionRepo.update(
      { schoolId, isDeleted: false },
      { isCurrent: false },
    );

    session.isCurrent = true;
    session.isActive = true;
    session.updatedById = userId;
    return await this.sessionRepo.save(session);
  }

  async getCurrentAcademicSession(schoolId: string) {
    let session = await this.sessionRepo.findOne({
      where: { schoolId, isCurrent: true, isDeleted: false },
    });
    if (!session) {
      session = await this.sessionRepo.findOne({
        where: { schoolId, isDeleted: false },
        order: { startDate: 'DESC', createdAt: 'DESC' },
      });
    }
    if (!session) {
      throw new NotFoundException('No active academic session found');
    }
    return session;
  }

  // ROOMS / CLASSROOMSPersisted DB Methods
  async createRoom(schoolId: string, dto: CreateRoomDto, userId: string) {
    const existing = await this.roomRepo.findOne({
      where: { schoolId, name: dto.name, isDeleted: false },
    });
    if (existing) {
      throw new BadRequestException(
        `Room "${dto.name}" already exists in this school.`,
      );
    }

    const room = this.roomRepo.create({
      schoolId,
      academicSessionId: dto.academicSessionId || null,
      name: dto.name,
      block: dto.block || 'Main Block',
      floor: dto.floor !== undefined ? dto.floor : 1,
      capacity: dto.capacity !== undefined ? dto.capacity : 40,
      equipment: dto.equipment || ['Smartboard', 'AC'],
      assignedSectionId: null,
      createdById: userId,
      updatedById: userId,
    });

    return await this.roomRepo.save(room);
  }

  async getRooms(schoolId: string, academicSessionId?: string) {
    try {
      if (!this.roomRepo) {
        this.roomRepo = this.dataSource.getRepository(Room);
      }
      let rooms = await this.roomRepo.find({
        where: { schoolId, isDeleted: false },
        order: { name: 'ASC' },
      });

      if (academicSessionId) {
        rooms = rooms.filter(
          (r) =>
            r.academicSessionId === String(academicSessionId) ||
            r.academicSessionId === null,
        );
      }

      const sections = await this.sectionRepo.find({
        where: { schoolId, isDeleted: false },
        relations: ['class'],
      });

      const sectionMap = new Map(sections.map((s) => [String(s.id), s]));

      return rooms.map((room) => {
        let assignedSectionName: string | undefined = undefined;
        let occupancy = 0;

        if (room.assignedSectionId) {
          const sec = sectionMap.get(String(room.assignedSectionId));
          if (sec) {
            assignedSectionName = `${sec.class?.name || 'Class'} - ${sec.name}`;
            occupancy = sec.capacity || 30;
          }
        }

        return {
          ...room,
          occupancy,
          assignedSectionName,
        };
      });
    } catch (e) {
      console.error('Error fetching rooms from DB:', e);
      return [];
    }
  }

  async getRoomById(schoolId: string, roomId: string) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId, schoolId, isDeleted: false },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async updateRoom(
    schoolId: string,
    roomId: string,
    dto: UpdateRoomDto,
    userId: string,
  ) {
    const room = await this.getRoomById(schoolId, roomId);

    if (dto.name && dto.name !== room.name) {
      const existing = await this.roomRepo.findOne({
        where: { schoolId, name: dto.name, isDeleted: false },
      });
      if (existing && existing.id !== roomId) {
        throw new BadRequestException(`Room "${dto.name}" already exists.`);
      }
    }

    if (dto.name !== undefined) room.name = dto.name;
    if (dto.block !== undefined) room.block = dto.block;
    if (dto.floor !== undefined) room.floor = dto.floor;
    if (dto.capacity !== undefined) room.capacity = dto.capacity;
    if (dto.equipment !== undefined) room.equipment = dto.equipment;
    if (dto.isActive !== undefined) room.isActive = dto.isActive;
    room.updatedById = userId;

    return await this.roomRepo.save(room);
  }

  async deleteRoom(schoolId: string, roomId: string, userId: string) {
    const room = await this.getRoomById(schoolId, roomId);

    // Unassign section if currently allocated
    if (room.assignedSectionId) {
      const sec = await this.sectionRepo.findOne({
        where: { id: room.assignedSectionId, schoolId },
      });
      if (sec && sec.room === room.name) {
        sec.room = '';
        sec.updatedById = userId;
        await this.sectionRepo.save(sec);
      }
    }

    room.isDeleted = true;
    room.assignedSectionId = null;
    room.updatedById = userId;
    await this.roomRepo.save(room);

    return { success: true, message: 'Room deleted successfully' };
  }

  async allocateRoom(
    schoolId: string,
    roomId: string,
    dto: AllocateRoomDto,
    userId: string,
  ) {
    const room = await this.getRoomById(schoolId, roomId);

    if (!dto.sectionId) {
      // UNASSIGN ROOM
      if (room.assignedSectionId) {
        const oldSec = await this.sectionRepo.findOne({
          where: { id: room.assignedSectionId, schoolId },
        });
        if (oldSec) {
          oldSec.room = '';
          oldSec.updatedById = userId;
          await this.sectionRepo.save(oldSec);
        }
      }

      room.assignedSectionId = null;
      room.updatedById = userId;
      return await this.roomRepo.save(room);
    }

    // ASSIGN ROOM TO SECTION
    const section = await this.sectionRepo.findOne({
      where: { id: dto.sectionId, schoolId, isDeleted: false },
      relations: ['class'],
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    // Conflict Check 1: Check if target section is ALREADY allocated to another room
    const existingRoomForSection = await this.roomRepo.findOne({
      where: { schoolId, assignedSectionId: section.id, isDeleted: false },
    });
    if (existingRoomForSection && existingRoomForSection.id !== roomId) {
      throw new BadRequestException(
        `Section "${section.class?.name || 'Class'} - ${section.name}" is already allocated to Room "${existingRoomForSection.name}". Unassign it first.`,
      );
    }

    // Conflict Check 2: If this room already had another section, clear that section's room property
    if (room.assignedSectionId && room.assignedSectionId !== section.id) {
      const prevSec = await this.sectionRepo.findOne({
        where: { id: room.assignedSectionId, schoolId },
      });
      if (prevSec) {
        prevSec.room = '';
        prevSec.updatedById = userId;
        await this.sectionRepo.save(prevSec);
      }
    }

    // Perform allocation
    room.assignedSectionId = section.id;
    room.updatedById = userId;

    section.room = room.name;
    section.updatedById = userId;

    await this.sectionRepo.save(section);
    return await this.roomRepo.save(room);
  }

  async copyAcademicSessionData(
    schoolId: string,
    dto: CopyAcademicSessionDataDto,
    userId: string,
  ) {
    const { fromAcademicSessionId, toAcademicSessionId, modules } = dto;

    if (fromAcademicSessionId === toAcademicSessionId) {
      throw new BadRequestException(
        'Source and target academic sessions must be different.',
      );
    }

    const [fromSession, toSession] = await Promise.all([
      this.sessionRepo.findOne({
        where: { id: fromAcademicSessionId, schoolId, isDeleted: false },
      }),
      this.sessionRepo.findOne({
        where: { id: toAcademicSessionId, schoolId, isDeleted: false },
      }),
    ]);

    if (!fromSession) {
      throw new NotFoundException(
        `Source academic session (${fromAcademicSessionId}) not found`,
      );
    }
    if (!toSession) {
      throw new NotFoundException(
        `Target academic session (${toAcademicSessionId}) not found`,
      );
    }

    const copyAll = !modules || modules.length === 0;
    const shouldCopyClasses = copyAll || modules.includes('classes');
    const shouldCopySections = copyAll || modules.includes('sections');
    const shouldCopySubjects = copyAll || modules.includes('subjects');
    const shouldCopyMappings = copyAll || modules.includes('mappings');
    const shouldCopyRooms = copyAll || modules.includes('rooms');
    const shouldCopyStaff = copyAll || modules.includes('staff');
    const shouldCopyStudents = copyAll || modules.includes('students');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const summary = {
        copiedClasses: 0,
        copiedSections: 0,
        copiedSubjects: 0,
        copiedMappings: 0,
        copiedRooms: 0,
        copiedStaffAssignments: 0,
        copiedStudentEnrollments: 0,
      };

      const classIdMap = new Map<string, string>();
      const sectionIdMap = new Map<string, string>();
      const subjectIdMap = new Map<string, string>();

      // 1. Copy Classes in Bulk
      if (shouldCopyClasses) {
        const sourceClasses = await queryRunner.manager.find(Class, {
          where: [
            {
              schoolId,
              academicSessionId: fromAcademicSessionId,
              isDeleted: false,
            },
            { schoolId, academicSessionId: IsNull(), isDeleted: false },
          ],
        });

        const newClassesToCreate: Class[] = [];

        for (const sourceClass of sourceClasses) {
          const existingTargetClass = await queryRunner.manager.findOne(Class, {
            where: {
              schoolId,
              name: sourceClass.name,
              academicSessionId: toAcademicSessionId,
              isDeleted: false,
            },
          });

          if (existingTargetClass) {
            classIdMap.set(sourceClass.id, existingTargetClass.id);
          } else {
            const newClass = queryRunner.manager.create(Class, {
              schoolId,
              academicSessionId: toAcademicSessionId,
              name: sourceClass.name,
              classCode: sourceClass.classCode,
              description: sourceClass.description,
              dailyAttendanceLimit: sourceClass.dailyAttendanceLimit,
              isActive: true,
              createdById: userId,
              updatedById: userId,
            });
            newClassesToCreate.push(newClass);
          }
        }

        if (newClassesToCreate.length > 0) {
          const savedClasses = await queryRunner.manager.save(
            Class,
            newClassesToCreate,
          );
          summary.copiedClasses = savedClasses.length;
          for (const sourceClass of sourceClasses) {
            if (!classIdMap.has(sourceClass.id)) {
              const matched = savedClasses.find(
                (sc) => sc.name === sourceClass.name,
              );
              if (matched) classIdMap.set(sourceClass.id, matched.id);
            }
          }
        }
      }

      // 2. Copy Sections in Bulk
      if (shouldCopySections) {
        const sourceSections = await queryRunner.manager.find(Section, {
          where: [
            {
              schoolId,
              academicSessionId: fromAcademicSessionId,
              isDeleted: false,
            },
            { schoolId, academicSessionId: IsNull(), isDeleted: false },
          ],
        });

        const newSectionsToCreate: Section[] = [];

        for (const sourceSec of sourceSections) {
          const targetClassId =
            classIdMap.get(sourceSec.classId) || sourceSec.classId;
          const existingTargetSec = await queryRunner.manager.findOne(Section, {
            where: {
              schoolId,
              classId: targetClassId,
              name: sourceSec.name,
              academicSessionId: toAcademicSessionId,
              isDeleted: false,
            },
          });

          if (existingTargetSec) {
            sectionIdMap.set(sourceSec.id, existingTargetSec.id);
          } else {
            const newSec = queryRunner.manager.create(Section, {
              schoolId,
              academicSessionId: toAcademicSessionId,
              classId: targetClassId,
              name: sourceSec.name,
              capacity: sourceSec.capacity,
              room: sourceSec.room,
              isDefault: sourceSec.isDefault,
              isActive: true,
              createdById: userId,
              updatedById: userId,
            });
            newSectionsToCreate.push(newSec);
          }
        }

        if (newSectionsToCreate.length > 0) {
          const savedSections = await queryRunner.manager.save(
            Section,
            newSectionsToCreate,
          );
          summary.copiedSections = savedSections.length;
          for (const sourceSec of sourceSections) {
            if (!sectionIdMap.has(sourceSec.id)) {
              const targetClassId =
                classIdMap.get(sourceSec.classId) || sourceSec.classId;
              const matched = savedSections.find(
                (ss) =>
                  ss.classId === targetClassId && ss.name === sourceSec.name,
              );
              if (matched) sectionIdMap.set(sourceSec.id, matched.id);
            }
          }
        }
      }

      // 3. Copy Subjects in Bulk
      if (shouldCopySubjects) {
        const sourceSubjects = await queryRunner.manager.find(Subject, {
          where: [
            {
              schoolId,
              academicSessionId: fromAcademicSessionId,
              isDeleted: false,
            },
            { schoolId, academicSessionId: IsNull(), isDeleted: false },
          ],
        });

        const newSubjectsToCreate: Subject[] = [];

        for (const sourceSub of sourceSubjects) {
          const existingTargetSub = await queryRunner.manager.findOne(Subject, {
            where: {
              schoolId,
              name: sourceSub.name,
              academicSessionId: toAcademicSessionId,
              isDeleted: false,
            },
          });

          if (existingTargetSub) {
            subjectIdMap.set(sourceSub.id, existingTargetSub.id);
          } else {
            const newSub = queryRunner.manager.create(Subject, {
              schoolId,
              academicSessionId: toAcademicSessionId,
              name: sourceSub.name,
              isActive: true,
              createdById: userId,
              updatedById: userId,
            });
            newSubjectsToCreate.push(newSub);
          }
        }

        if (newSubjectsToCreate.length > 0) {
          const savedSubjects = await queryRunner.manager.save(
            Subject,
            newSubjectsToCreate,
          );
          summary.copiedSubjects = savedSubjects.length;
          for (const sourceSub of sourceSubjects) {
            if (!subjectIdMap.has(sourceSub.id)) {
              const matched = savedSubjects.find(
                (ss) => ss.name === sourceSub.name,
              );
              if (matched) subjectIdMap.set(sourceSub.id, matched.id);
            }
          }
        }
      }

      // 4. Copy Mappings in Bulk
      if (shouldCopyMappings) {
        const sourceMappings = await queryRunner.manager.find(
          ClassSectionSubject,
          {
            where: [
              {
                schoolId,
                academicSessionId: fromAcademicSessionId,
                isDeleted: false,
              },
              { schoolId, academicSessionId: IsNull(), isDeleted: false },
            ],
          },
        );

        const newMappingsToCreate: ClassSectionSubject[] = [];

        for (const sourceMapping of sourceMappings) {
          const targetClassId =
            classIdMap.get(sourceMapping.classId) || sourceMapping.classId;
          const targetSectionId =
            sectionIdMap.get(sourceMapping.sectionId) ||
            sourceMapping.sectionId;
          const targetSubjectId =
            subjectIdMap.get(sourceMapping.subjectId) ||
            sourceMapping.subjectId;

          const existingMapping = await queryRunner.manager.findOne(
            ClassSectionSubject,
            {
              where: {
                schoolId,
                classId: targetClassId,
                sectionId: targetSectionId,
                subjectId: targetSubjectId,
                academicSessionId: toAcademicSessionId,
                isDeleted: false,
              },
            },
          );

          if (!existingMapping) {
            const newMapping = queryRunner.manager.create(ClassSectionSubject, {
              schoolId,
              academicSessionId: toAcademicSessionId,
              classId: targetClassId,
              sectionId: targetSectionId,
              subjectId: targetSubjectId,
              teacherId: sourceMapping.teacherId,
              isActive: true,
              createdById: userId,
              updatedById: userId,
            });
            newMappingsToCreate.push(newMapping);
          }
        }

        if (newMappingsToCreate.length > 0) {
          const savedMappings = await queryRunner.manager.save(
            ClassSectionSubject,
            newMappingsToCreate,
          );
          summary.copiedMappings = savedMappings.length;
        }
      }

      // 5. Copy Rooms in Bulk
      if (shouldCopyRooms) {
        const sourceRooms = await queryRunner.manager.find(Room, {
          where: [
            {
              schoolId,
              academicSessionId: fromAcademicSessionId,
              isDeleted: false,
            },
            { schoolId, academicSessionId: IsNull(), isDeleted: false },
          ],
        });

        const newRoomsToCreate: Room[] = [];

        for (const sourceRoom of sourceRooms) {
          const targetAssignedSectionId = sourceRoom.assignedSectionId
            ? sectionIdMap.get(sourceRoom.assignedSectionId) || null
            : null;

          const existingTargetRoom = await queryRunner.manager.findOne(Room, {
            where: {
              schoolId,
              name: sourceRoom.name,
              academicSessionId: toAcademicSessionId,
              isDeleted: false,
            },
          });

          if (!existingTargetRoom) {
            const newRoom = queryRunner.manager.create(Room, {
              schoolId,
              academicSessionId: toAcademicSessionId,
              name: sourceRoom.name,
              block: sourceRoom.block,
              floor: sourceRoom.floor,
              capacity: sourceRoom.capacity,
              equipment: sourceRoom.equipment,
              assignedSectionId: targetAssignedSectionId,
              isActive: true,
              createdById: userId,
              updatedById: userId,
            });
            newRoomsToCreate.push(newRoom);
          }
        }

        if (newRoomsToCreate.length > 0) {
          const savedRooms = await queryRunner.manager.save(
            Room,
            newRoomsToCreate,
          );
          summary.copiedRooms = savedRooms.length;
        }
      }

      // 6. Copy Staff Teacher Section Assignments in Bulk
      if (shouldCopyStaff) {
        const sourceStaffAssignments = await queryRunner.manager.find(
          TeacherSectionAssignment,
          {
            where: [
              {
                schoolId,
                academicSessionId: fromAcademicSessionId,
                isDeleted: false,
                isActive: true,
              },
              {
                schoolId,
                academicSessionId: IsNull(),
                isDeleted: false,
                isActive: true,
              },
            ],
          },
        );

        const newStaffToCreate: TeacherSectionAssignment[] = [];

        for (const sourceAssign of sourceStaffAssignments) {
          const targetClassId =
            classIdMap.get(sourceAssign.classId) || sourceAssign.classId;
          const targetSectionId = sourceAssign.sectionId
            ? sectionIdMap.get(sourceAssign.sectionId) || sourceAssign.sectionId
            : null;

          const existingAssign = await queryRunner.manager.findOne(
            TeacherSectionAssignment,
            {
              where: {
                schoolId,
                teacherId: sourceAssign.teacherId,
                classId: targetClassId,
                sectionId:
                  targetSectionId === null ? IsNull() : targetSectionId,
                academicSessionId: toAcademicSessionId,
                isDeleted: false,
              },
            },
          );

          if (!existingAssign) {
            const newAssign = queryRunner.manager.create(
              TeacherSectionAssignment,
              {
                schoolId,
                academicSessionId: toAcademicSessionId,
                teacherId: sourceAssign.teacherId,
                classId: targetClassId,
                sectionId: targetSectionId,
                isClassTeacher: sourceAssign.isClassTeacher,
                isActive: true,
                createdById: userId,
                updatedById: userId,
              },
            );
            newStaffToCreate.push(newAssign);
          }
        }

        if (newStaffToCreate.length > 0) {
          const savedStaff = await queryRunner.manager.save(
            TeacherSectionAssignment,
            newStaffToCreate,
          );
          summary.copiedStaffAssignments = savedStaff.length;
        }
      }

      // 7. Copy Student Enrollments in Bulk
      if (shouldCopyStudents) {
        const sourceEnrollments = await queryRunner.manager.find(
          StudentEnrollment,
          {
            where: {
              schoolId,
              academicSessionId: fromAcademicSessionId,
              isCurrent: true,
              isDeleted: false,
              isActive: true,
            },
          },
        );

        const newEnrollmentsToCreate: StudentEnrollment[] = [];

        for (const sourceEnv of sourceEnrollments) {
          const targetClassId =
            classIdMap.get(sourceEnv.classId) || sourceEnv.classId;
          const targetSectionId =
            sectionIdMap.get(sourceEnv.sectionId) || sourceEnv.sectionId;

          const existingEnv = await queryRunner.manager.findOne(
            StudentEnrollment,
            {
              where: {
                schoolId,
                studentId: sourceEnv.studentId,
                academicSessionId: toAcademicSessionId,
                isDeleted: false,
              },
            },
          );

          if (!existingEnv) {
            const newEnv = queryRunner.manager.create(StudentEnrollment, {
              schoolId,
              studentId: sourceEnv.studentId,
              classId: targetClassId,
              sectionId: targetSectionId,
              academicSessionId: toAcademicSessionId,
              rollNumber: sourceEnv.rollNumber,
              enrollmentState: EnrollmentStatusEnum.ACTIVE,
              enrollmentType: EnrollmentTypeEnum.PROMOTION,
              isCurrent: true,
              startDate: new Date().toISOString().split('T')[0],
              isActive: true,
              isDeleted: false,
              createdById: userId,
              updatedById: userId,
            });
            newEnrollmentsToCreate.push(newEnv);
          }
        }

        if (newEnrollmentsToCreate.length > 0) {
          const studentIds = newEnrollmentsToCreate.map((e) => e.studentId);
          await queryRunner.manager
            .createQueryBuilder()
            .update(StudentEnrollment)
            .set({ isCurrent: false })
            .where('school_id = :schoolId', { schoolId })
            .andWhere('student_id IN (:...studentIds)', { studentIds })
            .andWhere('academic_session_id = :fromAcademicSessionId', {
              fromAcademicSessionId,
            })
            .execute();

          const savedEnrollments = await queryRunner.manager.save(
            StudentEnrollment,
            newEnrollmentsToCreate,
          );
          summary.copiedStudentEnrollments = savedEnrollments.length;
        }
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: `Academic session data successfully copied from ${fromSession.name} to ${toSession.name}.`,
        summary,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAcademicAuditLogs(schoolId: string, academicSessionId?: string) {
    const logs: Array<{
      id: string;
      actorName: string;
      actorRole: string;
      action: string;
      category: string;
      details: string;
      timestamp: string | Date;
      beforeState: Record<string, unknown> | null;
      afterState: Record<string, unknown> | null;
    }> = [];

    // 1. Fetch section transfer history logs
    const transfers = await this.dataSource
      .getRepository(SectionTransferHistory)
      .find({
        where: { schoolId, isDeleted: false },
        order: { changedAt: 'DESC' },
        take: 50,
      });

    for (const t of transfers) {
      logs.push({
        id: `transfer-${t.id}`,
        actorName: 'System / Administrator',
        actorRole: 'ADMIN',
        action: 'SECTION_TRANSFER',
        category: 'Student',
        details:
          t.reason ||
          `Student section transfer recorded (Old Section ID: ${t.oldSectionId}, New Section ID: ${t.newSectionId})`,
        timestamp: t.changedAt || t.createdAt || new Date().toISOString(),
        beforeState: { sectionId: t.oldSectionId },
        afterState: { sectionId: t.newSectionId },
      });
    }

    // 2. Fetch class activity logs from DB
    const classWhere: Record<string, unknown> = {
      schoolId,
      isDeleted: false,
    };
    if (academicSessionId) {
      classWhere.academicSessionId = academicSessionId;
    }
    const classes = await this.classRepo.find({
      where: classWhere,
      order: { updatedAt: 'DESC' },
      take: 20,
    });

    for (const c of classes) {
      logs.push({
        id: `class-${c.id}`,
        actorName: 'Academic Coordinator',
        actorRole: 'ADMIN',
        action: 'CLASS_UPDATE',
        category: 'Class',
        details: `Class "${c.name}" (${c.classCode || 'Code N/A'}) configured. Capacity: ${c.capacity || 40}, Daily Attendance Limit: ${c.dailyAttendanceLimit || 1}`,
        timestamp: c.updatedAt || c.createdAt || new Date().toISOString(),
        beforeState: null,
        afterState: {
          name: c.name,
          capacity: c.capacity,
          isActive: c.isActive,
        },
      });
    }

    // 3. Fetch section activity logs from DB
    const sectionWhere: Record<string, unknown> = {
      schoolId,
      isDeleted: false,
    };
    if (academicSessionId) {
      sectionWhere.academicSessionId = academicSessionId;
    }
    const sections = await this.sectionRepo.find({
      where: sectionWhere,
      order: { updatedAt: 'DESC' },
      take: 20,
    });

    for (const s of sections) {
      logs.push({
        id: `section-${s.id}`,
        actorName: 'Academic Coordinator',
        actorRole: 'STAFF',
        action: 'SECTION_CONFIG',
        category: 'Section',
        details: `Section "${s.name}" configured. Capacity: ${s.capacity || 40}, Room: ${s.room || 'Unassigned'}`,
        timestamp: s.updatedAt || s.createdAt || new Date().toISOString(),
        beforeState: null,
        afterState: { name: s.name, capacity: s.capacity, room: s.room },
      });
    }

    // Sort logs descending by timestamp
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return {
      logs,
      data: logs,
      totalCount: logs.length,
    };
  }
}
