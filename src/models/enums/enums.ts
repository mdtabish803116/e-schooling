
/** Roles/types for school users (teachers, staff, etc.) */
export enum UserTypeEnum {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  ACCOUNTANT = 'accountant',
  STAFF = 'staff',
}

/** Role for school owner in school_members table */
export enum SchoolOwnerRoleEnum {
  OWNER = 'owner',
}

/** Roles for platform-level users (super admins, ops, support) */
export enum PlatformRoleEnum {
  SUPER_ADMIN = 'super_admin',
  OPS = 'ops',
  SUPPORT = 'support',
}

/**
 * All permission keys in the system.
 * Format: "{resource}:{action}"
 *
 * These are the exact string values stored in the permissions.key column.
 * Platform admins seed rows for each of these into the DB.
 * School owners assign these permissions to custom roles.
 * School users get permissions via their assigned roles.
 */
export enum PermissionKeyEnum {
  // Attendance
  ATTENDANCE_VIEW    = 'attendance:view',
  ATTENDANCE_CREATE  = 'attendance:create',
  ATTENDANCE_UPDATE  = 'attendance:update',
  ATTENDANCE_DELETE  = 'attendance:delete',

  // Classes
  CLASSES_VIEW   = 'classes:view',
  CLASSES_CREATE = 'classes:create',
  CLASSES_UPDATE = 'classes:update',
  CLASSES_DELETE = 'classes:delete',

  // Students
  STUDENTS_VIEW   = 'students:view',
  STUDENTS_CREATE = 'students:create',
  STUDENTS_UPDATE = 'students:update',
  STUDENTS_DELETE = 'students:delete',

  // Fees
  FEES_VIEW   = 'fees:view',
  FEES_CREATE = 'fees:create',
  FEES_UPDATE = 'fees:update',
  FEES_MANAGE = 'fees:manage',

  // Timetable
  TIMETABLE_VIEW   = 'timetable:view',
  TIMETABLE_MANAGE = 'timetable:manage',

  // Exams
  EXAMS_VIEW   = 'exams:view',
  EXAMS_CREATE = 'exams:create',
  EXAMS_UPDATE = 'exams:update',

  // Reports
  REPORTS_VIEW = 'reports:view',

  // School Users (manage staff)
  SCHOOL_USERS_VIEW   = 'school_users:view',
  SCHOOL_USERS_CREATE = 'school_users:create',
  SCHOOL_USERS_UPDATE = 'school_users:update',
}

export enum StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
  ARCHIVED = 'archived',
  DROPPED = 'dropped'
}

export enum InvitationStatusEnum {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum BillingCycleEnum {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum SubscriptionStatusEnum {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended'
}

export enum PaymentGatewayEnum {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  CASHFREE = 'cashfree'
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum InvoiceStatusEnum {
  PAID = 'paid',
  UNPAID = 'unpaid',
  OVERDUE = 'overdue'
}

export enum EnrollmentStatusEnum {
  ACTIVE = 'active',
  PROMOTED = 'promoted',
  DEMOTED = 'demoted',
  TRANSFERRED = 'transferred',
  COMPLETED = 'completed',
  DROPPED = 'dropped'
}

export enum EnrollmentTypeEnum {
  ADMISSION = 'admission',
  PROMOTION = 'promotion',
  DEMOTION = 'demotion',
  TRANSFER = 'transfer',
  REPEAT = 'repeat',
  SPECIAL_PROMOTION = 'special_promotion'
}

export enum ActionTypeEnum {
  PROMOTION = 'promotion',
  DEMOTION = 'demotion',
  SECTION_TRANSFER = 'section_transfer',
  SPECIAL_PROMOTION = 'special_promotion',
  REPEAT = 'repeat'
}

export enum JobTypeEnum {
  STUDENT_IMPORT = 'student_import',
  PROMOTION = 'promotion',
  DEMOTION = 'demotion',
  SECTION_TRANSFER = 'section_transfer'
}

export enum JobStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum AttendanceStatusEnum {
  PRESENT = 'present',
  ABSENT = 'absent',
  LEAVE = 'leave',
  HALF_DAY = 'half_day'
}
