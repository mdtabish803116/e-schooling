
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

export enum ResourceEnum {
  DASHBOARD = 'dashboard',
  ATTENDANCE = 'attendance',
  CLASSES = 'classes',
  SECTIONS = 'sections',
  SUBJECTS = 'subjects',
  ACADEMIC_MAPPING = 'academic_mapping',
  STUDENTS = 'students',
  FEES = 'fees',
  TIMETABLE = 'timetable',
  EXAMS = 'exams',
  REPORTS = 'reports',
  SCHOOL_USERS = 'school_users',
  SCHOOL_ROLES = 'school_roles',
  PLATFORM_SCHOOLS = 'platform:schools',
  PLATFORM_OWNERS = 'platform:owners',
  PLATFORM_STUDENTS = 'platform:students',
  PLATFORM_STAFF = 'platform:staff',
  PLATFORM_FEATURES = 'platform:features',
  PLATFORM_MODULES = 'platform:modules',
  FINANCE_ORDER = 'finance:order',
  FINANCE_INVOICE = 'finance:invoice',
  SUBSCRIPTION = 'subscription',
}

export enum ActionEnum {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
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

