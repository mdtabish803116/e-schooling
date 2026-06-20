
/** Roles/types for school users (teachers, staff, etc.) */
export enum UserTypeEnum {
  ACADEMIC = 'academic',
  NON_ACADEMIC = 'non_academic',
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
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',

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

  // Sections
  SECTIONS_VIEW   = 'sections:view',
  SECTIONS_CREATE = 'sections:create',
  SECTIONS_UPDATE = 'sections:update',
  SECTIONS_DELETE = 'sections:delete',

  // Subjects
  SUBJECTS_VIEW   = 'subjects:view',
  SUBJECTS_CREATE = 'subjects:create',
  SUBJECTS_UPDATE = 'subjects:update',
  SUBJECTS_DELETE = 'subjects:delete',

  // Academic Mapping
  ACADEMIC_MAPPING_VIEW   = 'academic_mapping:view',
  ACADEMIC_MAPPING_MANAGE = 'academic_mapping:manage',

  // Students
  STUDENTS_VIEW   = 'students:view',
  STUDENTS_CREATE = 'students:create',
  STUDENTS_UPDATE = 'students:update',
  STUDENTS_DELETE = 'students:delete',
  STUDENTS_ADMISSION = 'students:admission',

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
  SCHOOL_USERS_UPDATE = 'school_users:update',

  // School Roles & Permissions
  SCHOOL_ROLES_VIEW = 'school_roles:view',
  SCHOOL_ROLES_MANAGE = 'school_roles:manage',

  // Platform Administration
  PLATFORM_SCHOOLS_VIEW   = 'platform:schools:view',
  PLATFORM_SCHOOLS_UPDATE = 'platform:schools:update',
  PLATFORM_SCHOOLS_DELETE = 'platform:schools:delete',

  PLATFORM_OWNERS_VIEW   = 'platform:owners:view',
  PLATFORM_OWNERS_UPDATE = 'platform:owners:update',
  PLATFORM_OWNERS_DELETE = 'platform:owners:delete',

  PLATFORM_STUDENTS_VIEW = 'platform:students:view',
  PLATFORM_STAFF_VIEW    = 'platform:staff:view',

  PLATFORM_FEATURES_VIEW = 'platform:features:view',
  PLATFORM_FEATURES_MANAGE = 'platform:features:manage',

  PLATFORM_MODULES_VIEW = 'platform:modules:view',
  PLATFORM_MODULES_MANAGE = 'platform:modules:manage',

  // Finance & Subscription
  FINANCE_ORDER_VIEW   = 'finance:order:view',
  FINANCE_INVOICE_VIEW = 'finance:invoice:view',
  SUBSCRIPTION_VIEW    = 'subscription:view'
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

export enum PlanCodeEnum {
  TRIAL = 'TRIAL',
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM'
}

export enum AddonTypeEnum {
  STUDENT_BOOSTER_SMALL = 'STUDENT_BOOSTER_SMALL',
  STUDENT_BOOSTER_MEDIUM = 'STUDENT_BOOSTER_MEDIUM',
  WHATSAPP_BOOSTER_SMALL = 'WHATSAPP_BOOSTER_SMALL',
  WHATSAPP_BOOSTER_MEDIUM = 'WHATSAPP_BOOSTER_MEDIUM',
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

export enum OrderStatusEnum {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum OrderItemTypeEnum {
  PLAN = 'PLAN',
  FEATURE = 'FEATURE',
  ADDON = 'ADDON'
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
  SECTION_TRANSFER = 'section_transfer',
  PAYMENT_RECONCILIATION = 'payment_reconciliation',
  SUBSCRIPTION_EXPIRY_CHECK = 'subscription_expiry_check',
  SEND_WHATSAPP = 'send_whatsapp',
  SEND_EMAIL = 'send_email',
  DAILY_CLEANUP = 'daily_cleanup',
  EXPORT_EXCEL = 'export_excel'
}

export enum JobStatusEnum {
  PENDING = 'pending',
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export enum AttendanceStatusEnum {
  PRESENT = 'present',
  ABSENT = 'absent',
  LEAVE = 'leave',
  HALF_DAY = 'half_day',
  LATE = 'late'
}

/** Feature Entitlement & Billing Add-ons mapping */
export enum FeatureTypeEnum {
  CORE = 'CORE',
  ADDON = 'ADDON',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UsageUnitEnum {
  NONE = 'NONE',
  STUDENTS = 'STUDENTS',
  MESSAGES = 'MESSAGES',
  ADMINS = 'ADMINS',
  STORAGE_GB = 'STORAGE_GB',
  API_CALLS = 'API_CALLS',
}

export enum OverrideTypeEnum {
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
  CUSTOM_PRICE = 'CUSTOM_PRICE',
  CUSTOM_LIMIT = 'CUSTOM_LIMIT',
  FREE_ACCESS = 'FREE_ACCESS',
}

export enum FeatureBillingCycleEnum {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE_TIME',
}

