import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { RBACService } from '../../services/school-roles/rbac.service';
import {
  PERMISSION_KEY,
  PermissionMetadata,
} from '../decorators/permission.decorator';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { School } from '../../models/entities/school/school.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        message:
          'Your session could not be authenticated. Please log in again to continue.',
      });
    }

    // SCHOOL ID TENANT VALIDATION & OWNERSHIP CHECK
    const routeSchoolId =
      request.params?.schoolId ||
      request.body?.schoolId ||
      request.query?.schoolId;
    if (routeSchoolId && routeSchoolId !== 'undefined') {
      if (user.actorType === 'school_owner') {
        const membership = await this.dataSource
          .getRepository(SchoolOwnerMember)
          .findOne({
            where: {
              schoolOwnerId: user.id,
              schoolId: routeSchoolId,
              isActive: true,
            },
          });

        let hasAccess = !!membership;
        if (!hasAccess) {
          const school = await this.dataSource.getRepository(School).findOne({
            where: { id: routeSchoolId, isDeleted: false },
          });
          if (
            school &&
            (String(school.createdById) === String(user.id) ||
              (school as any).ownerId === String(user.id))
          ) {
            hasAccess = true;
          }
        }

        if (!hasAccess) {
          throw new ForbiddenException({
            message: `Access Restricted: You do not have ownership or administrative access to School #${routeSchoolId}. Please select a school belonging to your owner account.`,
          });
        }
      } else if (
        user.schoolId &&
        String(user.schoolId) !== String(routeSchoolId)
      ) {
        throw new ForbiddenException({
          message: `Access Restricted: Your staff account is assigned to School #${user.schoolId} and cannot access School #${routeSchoolId}. Please return to your assigned school portal.`,
        });
      }
    }

    if (!requiredPermission) {
      return true;
    }

    // Allow users to view/edit their own profile details without any permission requirement
    if (requiredPermission.resource === 'school_users') {
      const routeUserId =
        request.params?.userId ||
        request.params?.id ||
        request.params?.schoolUserId;
      if (!routeUserId || String(routeUserId) === String(user.id)) {
        return true;
      }
      if (requiredPermission.action === 'view') {
        return true;
      }
    }

    // School owners bypass granular RBAC checks for their schools
    if (user.actorType === 'school_owner') {
      return true;
    }

    let hasPermission = await this.rbacService.hasPermission(
      user.id,
      requiredPermission.resource,
      requiredPermission.action,
    );

    // Fallback: If route requires 'view' and user doesn't have it, check if they have 'view_assigned'
    if (!hasPermission && requiredPermission.action === 'view') {
      const hasViewAssigned = await this.rbacService.hasPermission(
        user.id,
        requiredPermission.resource,
        'view_assigned',
      );
      if (hasViewAssigned) {
        hasPermission = true;
      }

      // Fallback for academic_mapping: allow if user has permission to view sections, classes, or subjects
      if (
        !hasPermission &&
        (requiredPermission.resource === 'academic_mapping' ||
          requiredPermission.resource === 'ACADEMIC_MAPPING')
      ) {
        const [hasSections, hasClasses, hasSubjects] = await Promise.all([
          this.rbacService.hasPermission(user.id, 'sections', 'view'),
          this.rbacService.hasPermission(user.id, 'classes', 'view'),
          this.rbacService.hasPermission(user.id, 'subjects', 'view'),
        ]);
        if (hasSections || hasClasses || hasSubjects) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      const resourceTitles: Record<string, string> = {
        classes: 'Classes & Grades',
        sections: 'Class Sections',
        subjects: 'Academic Subjects',
        academic_mapping: 'Course & Teacher Mappings',
        academic_sessions: 'Academic Sessions',
        academic_years: 'Academic Years',
        students: 'Student Records',
        student_credentials: 'Student Portal Logins',
        staff: 'Staff & Faculty Records',
        staff_credentials: 'Staff Portal Logins',
        school_users: 'User Management',
        school_roles: 'Roles & Permissions',
        attendance: 'Attendance Records',
        take_attendance: 'Mark Attendance',
        timetable: 'Timetable Schedules',
        exams: 'Examinations & Marks',
        fees: 'Fee Records & Collections',
        finance_invoice: 'Fee Invoices',
        reports: 'School Reports',
        documents: 'Documents & Certificates',
        document_masters: 'Document Templates',
        rooms: 'Classrooms & Facilities',
        homework: 'Homework & Assignments',
        library: 'Library Records',
        transport: 'Transport & Routes',
        hostel: 'Hostel Facilities',
        announcements: 'Announcements',
        tasks: 'Task Management',
        schools: 'School Settings',
        settings: 'Configuration Settings',
        subscription: 'Subscription & Plans',
        audit_logs: 'Audit Logs',
      };

      const actionVerbs: Record<string, string> = {
        view: 'view',
        read: 'view',
        view_assigned: 'view assigned records in',
        create: 'create new entries in',
        update: 'edit or update',
        delete: 'delete or remove records from',
      };

      const resKey = String(requiredPermission.resource).toLowerCase();
      const actKey = String(requiredPermission.action).toLowerCase();
      const friendlyModule =
        resourceTitles[resKey] ||
        String(requiredPermission.resource).replace(/_/g, ' ');
      const friendlyAction =
        actionVerbs[actKey] || String(requiredPermission.action);

      throw new ForbiddenException({
        message: `You do not have permission to ${friendlyAction} ${friendlyModule}. Please contact your school administrator if you need access. (Permission '${requiredPermission.resource}:${requiredPermission.action}' denied)`,
      });
    }

    return true;
  }
}
