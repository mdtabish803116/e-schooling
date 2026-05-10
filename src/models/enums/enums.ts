
export enum RoleEnum {
  SUPER_ADMIN = 'super_admin',
  OPS = 'ops',
  SUPPORT = 'support',
  OWNER = 'owner',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  ACCOUNTANT = 'accountant',
  STAFF = 'staff'
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

export enum ActionTypeEnum {
  PROMOTION = 'promotion',
  DEMOTED = 'demotion',
  SECTION_TRANSFER = 'section_transfer'
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
