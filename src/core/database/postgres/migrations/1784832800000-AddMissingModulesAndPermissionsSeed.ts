import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingModulesAndPermissionsSeed1784832800000 implements MigrationInterface {
  name = 'AddMissingModulesAndPermissionsSeed1784832800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Sync primary key sequences to avoid key collision
    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('"e_schooling"."module_operation_permissions"', 'id'),
        COALESCE((SELECT MAX(id) FROM "e_schooling"."module_operation_permissions"), 1)
      );
      SELECT setval(
        pg_get_serial_sequence('"e_schooling"."module_masters"', 'id'),
        COALESCE((SELECT MAX(id) FROM "e_schooling"."module_masters"), 1)
      );
      SELECT setval(
        pg_get_serial_sequence('"e_schooling"."operation_masters"', 'id'),
        COALESCE((SELECT MAX(id) FROM "e_schooling"."operation_masters"), 1)
      );
    `);

    // 1. Seed Operations if missing
    await queryRunner.query(`
      INSERT INTO "e_schooling"."operation_masters" ("name", "code", "description", "is_active", "is_delete")
      VALUES
        ('view', 'VIEW', 'Allows read-only access to components', true, false),
        ('create', 'CREATE', 'Allows creating new records', true, false),
        ('update', 'UPDATE', 'Allows modifying existing records', true, false),
        ('delete', 'DELETE', 'Allows soft-deleting/revoking records', true, false),
        ('view_assigned', 'VIEW_ASSIGNED', 'Allows viewing only assigned records', true, false)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "is_active" = true,
        "is_delete" = false;
    `);

    // 2. Seed Modules if missing
    const modules = [
      {
        name: 'Dashboard',
        code: 'DASHBOARD',
        route: '/dashboard',
        icon: 'dashboard',
        order: 1,
        group: false,
        sidebar: true,
      },
      {
        name: 'Academics',
        code: 'ACADEMICS',
        route: '/academics',
        icon: 'school',
        order: 2,
        group: true,
        sidebar: true,
      },
      {
        name: 'Classes',
        code: 'CLASSES',
        route: '/academics/classes',
        icon: 'class',
        order: 3,
        group: false,
        sidebar: true,
      },
      {
        name: 'Subjects',
        code: 'SUBJECTS',
        route: '/academics/subjects',
        icon: 'book',
        order: 4,
        group: false,
        sidebar: true,
      },
      {
        name: 'Sections',
        code: 'SECTIONS',
        route: '/academics/sections',
        icon: 'view_list',
        order: 5,
        group: false,
        sidebar: true,
      },
      {
        name: 'Academic Mapping',
        code: 'ACADEMIC_MAPPING',
        route: '/academics/class-section-subject',
        icon: 'assignment_turned_in',
        order: 6,
        group: false,
        sidebar: true,
      },
      {
        name: 'Academic Years',
        code: 'ACADEMIC_YEARS',
        route: '/academics/years',
        icon: 'calendar_today',
        order: 6,
        group: false,
        sidebar: true,
      },
      {
        name: 'Academic Sessions',
        code: 'ACADEMIC_SESSIONS',
        route: '/academics/sessions',
        icon: 'date_range',
        order: 6,
        group: false,
        sidebar: true,
      },
      {
        name: 'Students',
        code: 'STUDENTS',
        route: '/students',
        icon: 'people',
        order: 7,
        group: false,
        sidebar: true,
      },
      {
        name: 'Staff',
        code: 'STAFF',
        route: '/staff',
        icon: 'badge',
        order: 7,
        group: false,
        sidebar: true,
      },
      {
        name: 'Attendance',
        code: 'ATTENDANCE',
        route: '/attendance',
        icon: 'check_circle',
        order: 8,
        group: true,
        sidebar: true,
      },
      {
        name: 'Attendance History',
        code: 'ATTENDANCE_HISTORY',
        route: '/attendance/history',
        icon: 'history',
        order: 81,
        group: false,
        sidebar: true,
      },
      {
        name: 'Take Attendance',
        code: 'TAKE_ATTENDANCE',
        route: '/attendance/take',
        icon: 'how_to_reg',
        order: 82,
        group: false,
        sidebar: true,
      },
      {
        name: 'Fees',
        code: 'FEES',
        route: '/fees',
        icon: 'attach_money',
        order: 9,
        group: false,
        sidebar: true,
      },
      {
        name: 'Timetable',
        code: 'TIMETABLE',
        route: '/timetable',
        icon: 'schedule',
        order: 10,
        group: false,
        sidebar: true,
      },
      {
        name: 'Exams',
        code: 'EXAMS',
        route: '/exams',
        icon: 'assignment',
        order: 11,
        group: false,
        sidebar: true,
      },
      {
        name: 'Homework',
        code: 'HOMEWORK',
        route: '/homework',
        icon: 'assignment_turned_in',
        order: 11,
        group: false,
        sidebar: true,
      },
      {
        name: 'Reports',
        code: 'REPORTS',
        route: '/reports',
        icon: 'bar_chart',
        order: 12,
        group: false,
        sidebar: true,
      },
      {
        name: 'Announcements',
        code: 'ANNOUNCEMENTS',
        route: '/announcements',
        icon: 'bell',
        order: 16,
        group: false,
        sidebar: true,
      },
      {
        name: 'Tasks',
        code: 'TASKS',
        route: '/tasks',
        icon: 'check_square',
        order: 17,
        group: false,
        sidebar: true,
      },
      {
        name: 'Administration',
        code: 'ADMINISTRATION',
        route: '/administration',
        icon: 'settings',
        order: 90,
        group: true,
        sidebar: true,
      },
      {
        name: 'School Users',
        code: 'SCHOOL_USERS',
        route: '/administration/users',
        icon: 'manage_accounts',
        order: 91,
        group: false,
        sidebar: true,
      },
      {
        name: 'Student Credentials',
        code: 'STUDENT_CREDENTIALS',
        route: '/students/credentials',
        icon: 'key',
        order: 91,
        group: false,
        sidebar: false,
      },
      {
        name: 'Staff Credentials',
        code: 'STAFF_CREDENTIALS',
        route: '/administration/staff-credentials',
        icon: 'badge',
        order: 91,
        group: false,
        sidebar: false,
      },
      {
        name: 'School Roles',
        code: 'SCHOOL_ROLES',
        route: '/administration/roles',
        icon: 'admin_panel_settings',
        order: 92,
        group: false,
        sidebar: true,
      },
      {
        name: 'Subscription',
        code: 'SUBSCRIPTION',
        route: '/administration/subscription',
        icon: 'payment',
        order: 93,
        group: false,
        sidebar: true,
      },
      {
        name: 'Finance Order',
        code: 'FINANCE_ORDER',
        route: '/administration/orders',
        icon: 'shopping_cart',
        order: 94,
        group: false,
        sidebar: true,
      },
      {
        name: 'Finance Invoice',
        code: 'FINANCE_INVOICE',
        route: '/administration/invoices',
        icon: 'receipt',
        order: 95,
        group: false,
        sidebar: true,
      },
      {
        name: 'School Settings',
        code: 'SCHOOL_SETTINGS',
        route: '/settings/school',
        icon: 'settings',
        order: 95,
        group: false,
        sidebar: true,
      },
      {
        name: 'Schools',
        code: 'SCHOOLS',
        route: '/schools',
        icon: 'business',
        order: 95,
        group: false,
        sidebar: true,
      },
    ];

    for (const m of modules) {
      await queryRunner.query(`
        INSERT INTO "e_schooling"."module_masters"
          ("name", "code", "route_path", "icon", "display_order", "is_menu_group", "show_in_sidebar", "is_visible", "is_active", "is_delete")
        VALUES
          ('${m.name}', '${m.code}', '${m.route}', '${m.icon}', ${m.order}, ${m.group}, ${m.sidebar}, true, true, false)
        ON CONFLICT ("code") DO UPDATE SET
          "name" = EXCLUDED."name",
          "route_path" = EXCLUDED."route_path",
          "icon" = EXCLUDED."icon",
          "display_order" = EXCLUDED."display_order",
          "show_in_sidebar" = EXCLUDED."show_in_sidebar",
          "is_active" = true,
          "is_delete" = false;
      `);
    }

    // 3. Link Module Operation Permissions
    const permPairs = [
      ['DASHBOARD', 'VIEW'],
      ['ATTENDANCE', 'VIEW'],
      ['ATTENDANCE', 'CREATE'],
      ['ATTENDANCE', 'UPDATE'],
      ['ATTENDANCE', 'DELETE'],
      ['ATTENDANCE_HISTORY', 'VIEW'],
      ['ATTENDANCE_HISTORY', 'CREATE'],
      ['ATTENDANCE_HISTORY', 'UPDATE'],
      ['ATTENDANCE_HISTORY', 'DELETE'],
      ['TAKE_ATTENDANCE', 'VIEW'],
      ['TAKE_ATTENDANCE', 'CREATE'],
      ['TAKE_ATTENDANCE', 'UPDATE'],
      ['TAKE_ATTENDANCE', 'DELETE'],
      ['CLASSES', 'VIEW'],
      ['CLASSES', 'VIEW_ASSIGNED'],
      ['CLASSES', 'CREATE'],
      ['CLASSES', 'UPDATE'],
      ['CLASSES', 'DELETE'],
      ['SUBJECTS', 'VIEW'],
      ['SUBJECTS', 'CREATE'],
      ['SUBJECTS', 'UPDATE'],
      ['SUBJECTS', 'DELETE'],
      ['SECTIONS', 'VIEW'],
      ['SECTIONS', 'VIEW_ASSIGNED'],
      ['SECTIONS', 'CREATE'],
      ['SECTIONS', 'UPDATE'],
      ['SECTIONS', 'DELETE'],
      ['ACADEMIC_MAPPING', 'VIEW'],
      ['ACADEMIC_MAPPING', 'CREATE'],
      ['ACADEMIC_MAPPING', 'UPDATE'],
      ['ACADEMIC_MAPPING', 'DELETE'],
      ['ACADEMIC_YEARS', 'VIEW'],
      ['ACADEMIC_YEARS', 'CREATE'],
      ['ACADEMIC_YEARS', 'UPDATE'],
      ['ACADEMIC_YEARS', 'DELETE'],
      ['ACADEMIC_SESSIONS', 'VIEW'],
      ['ACADEMIC_SESSIONS', 'CREATE'],
      ['ACADEMIC_SESSIONS', 'UPDATE'],
      ['ACADEMIC_SESSIONS', 'DELETE'],
      ['STUDENTS', 'VIEW'],
      ['STUDENTS', 'CREATE'],
      ['STUDENTS', 'UPDATE'],
      ['STUDENTS', 'DELETE'],
      ['STAFF', 'VIEW'],
      ['STAFF', 'VIEW_ASSIGNED'],
      ['STAFF', 'CREATE'],
      ['STAFF', 'UPDATE'],
      ['STAFF', 'DELETE'],
      ['FEES', 'VIEW'],
      ['FEES', 'CREATE'],
      ['FEES', 'UPDATE'],
      ['FEES', 'DELETE'],
      ['TIMETABLE', 'VIEW'],
      ['TIMETABLE', 'VIEW_ASSIGNED'],
      ['TIMETABLE', 'CREATE'],
      ['TIMETABLE', 'UPDATE'],
      ['TIMETABLE', 'DELETE'],
      ['EXAMS', 'VIEW'],
      ['EXAMS', 'CREATE'],
      ['EXAMS', 'UPDATE'],
      ['EXAMS', 'DELETE'],
      ['HOMEWORK', 'VIEW'],
      ['HOMEWORK', 'VIEW_ASSIGNED'],
      ['HOMEWORK', 'CREATE'],
      ['HOMEWORK', 'UPDATE'],
      ['HOMEWORK', 'DELETE'],
      ['REPORTS', 'VIEW'],
      ['ANNOUNCEMENTS', 'VIEW'],
      ['ANNOUNCEMENTS', 'CREATE'],
      ['ANNOUNCEMENTS', 'UPDATE'],
      ['ANNOUNCEMENTS', 'DELETE'],
      ['TASKS', 'VIEW'],
      ['TASKS', 'CREATE'],
      ['TASKS', 'UPDATE'],
      ['TASKS', 'DELETE'],
      ['SCHOOL_ROLES', 'VIEW'],
      ['SCHOOL_ROLES', 'CREATE'],
      ['SCHOOL_ROLES', 'UPDATE'],
      ['SCHOOL_ROLES', 'DELETE'],
      ['SCHOOL_USERS', 'VIEW'],
      ['SCHOOL_USERS', 'CREATE'],
      ['SCHOOL_USERS', 'UPDATE'],
      ['SCHOOL_USERS', 'DELETE'],
      ['STUDENT_CREDENTIALS', 'VIEW'],
      ['STUDENT_CREDENTIALS', 'CREATE'],
      ['STUDENT_CREDENTIALS', 'UPDATE'],
      ['STUDENT_CREDENTIALS', 'DELETE'],
      ['STAFF_CREDENTIALS', 'VIEW'],
      ['STAFF_CREDENTIALS', 'CREATE'],
      ['STAFF_CREDENTIALS', 'UPDATE'],
      ['STAFF_CREDENTIALS', 'DELETE'],
      ['SUBSCRIPTION', 'VIEW'],
      ['SUBSCRIPTION', 'CREATE'],
      ['SUBSCRIPTION', 'UPDATE'],
      ['SUBSCRIPTION', 'DELETE'],
      ['FINANCE_ORDER', 'VIEW'],
      ['FINANCE_INVOICE', 'VIEW'],
      ['SCHOOL_SETTINGS', 'VIEW'],
      ['SCHOOL_SETTINGS', 'CREATE'],
      ['SCHOOL_SETTINGS', 'UPDATE'],
      ['SCHOOL_SETTINGS', 'DELETE'],
      ['SCHOOLS', 'VIEW'],
      ['SCHOOLS', 'CREATE'],
      ['SCHOOLS', 'UPDATE'],
      ['SCHOOLS', 'DELETE'],
    ];

    for (const [modCode, opCode] of permPairs) {
      await queryRunner.query(`
        INSERT INTO "e_schooling"."module_operation_permissions" ("module_id", "operation_id", "description", "is_active", "is_delete")
        SELECT m.id, o.id, 'Grants permission to ' || o.name || ' in ' || m.name, true, false
        FROM "e_schooling"."module_masters" m
        CROSS JOIN "e_schooling"."operation_masters" o
        WHERE m.code = '${modCode}' AND o.code = '${opCode}'
        AND NOT EXISTS (
          SELECT 1 FROM "e_schooling"."module_operation_permissions" mop
          WHERE mop.module_id = m.id AND mop.operation_id = o.id
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "e_schooling"."module_operation_permissions";`,
    );
  }
}
