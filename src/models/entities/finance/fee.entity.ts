import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'fee_heads', schema: 'e_schooling' })
export class FeeHead {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_mandatory', type: 'boolean', default: true })
  isMandatory: boolean;

  @Column({ name: 'is_refundable', type: 'boolean', default: false })
  isRefundable: boolean;

  @Column({ name: 'is_taxable', type: 'boolean', default: false })
  isTaxable: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_structures', schema: 'e_schooling' })
export class FeeStructure {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'plan_type', type: 'varchar', default: 'ANNUAL' })
  planType: string;

  @Index()
  @Column({ name: 'class_id', type: 'bigint', nullable: true })
  classId: string | null;

  @Column({ name: 'section_id', type: 'bigint', nullable: true })
  sectionId: string | null;

  @Column({ name: 'student_id', type: 'bigint', nullable: true })
  studentId: string | null;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: string | null;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: string | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  totalAmount: number;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_structure_items', schema: 'e_schooling' })
export class FeeStructureItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'fee_structure_id', type: 'bigint' })
  feeStructureId: string;

  @Column({ name: 'fee_head_id', type: 'bigint' })
  feeHeadId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional: boolean;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_assignments', schema: 'e_schooling' })
export class FeeAssignment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'fee_structure_id', type: 'bigint' })
  feeStructureId: string;

  @Column({ name: 'student_id', type: 'bigint', nullable: true })
  studentId: string | null;

  @Column({ name: 'class_id', type: 'bigint', nullable: true })
  classId: string | null;

  @Column({ name: 'section_id', type: 'bigint', nullable: true })
  sectionId: string | null;

  @Column({ name: 'assigned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_schedules', schema: 'e_schooling' })
export class FeeSchedule {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'fee_structure_id', type: 'bigint' })
  feeStructureId: string;

  @Column({ name: 'schedule_type', type: 'varchar', default: 'MONTHLY' })
  scheduleType: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ name: 'grace_period_days', type: 'integer', default: 0 })
  gracePeriodDays: number;

  @Column({ name: 'fine_rule_id', type: 'bigint', nullable: true })
  fineRuleId: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_schedule_installments', schema: 'e_schooling' })
export class FeeScheduleInstallment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'fee_structure_id', type: 'bigint' })
  feeStructureId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'student_fee_ledgers', schema: 'e_schooling' })
export class StudentFeeLedger {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Index()
  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @Column({ name: 'fee_structure_id', type: 'bigint', nullable: true })
  feeStructureId: string | null;

  @Column({ name: 'invoice_number', type: 'varchar', nullable: true })
  invoiceNumber: string | null;

  @Column({ name: 'transaction_type', type: 'varchar' }) // DEBIT | CREDIT
  transactionType: string;

  @Column({ name: 'entry_type', type: 'varchar' }) // TUITION_GENERATED | TRANSPORT | FINE | ADDITIONAL_CHARGE | PAYMENT | SCHOLARSHIP | DISCOUNT | CONCESSION
  entryType: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_payments', schema: 'e_schooling' })
export class FeePayment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Index()
  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @Column({ name: 'invoice_id', type: 'varchar', nullable: true })
  invoiceId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'payment_method', type: 'varchar', default: 'CASH' })
  paymentMethod: string;

  @Column({ name: 'transaction_reference', type: 'varchar', nullable: true })
  transactionReference: string | null;

  @Column({ name: 'cheque_number', type: 'varchar', nullable: true })
  chequeNumber: string | null;

  @Column({ name: 'bank_name', type: 'varchar', nullable: true })
  bankName: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paidAt: Date;

  @Column({ type: 'varchar', default: 'PAID' })
  status: string;

  @Column({ name: 'receipt_id', type: 'bigint', nullable: true })
  receiptId: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'payment_allocations', schema: 'e_schooling' })
export class PaymentAllocation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'fee_payment_id', type: 'bigint' })
  feePaymentId: string;

  @Column({ name: 'fee_structure_item_id', type: 'bigint', nullable: true })
  feeStructureItemId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_receipts', schema: 'e_schooling' })
export class FeeReceipt {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'fee_payment_id', type: 'bigint' })
  feePaymentId: string;

  @Column({ name: 'receipt_number', type: 'varchar' })
  receiptNumber: string;

  @Column({ name: 'qr_code_data', type: 'text', nullable: true })
  qrCodeData: string | null;

  @Column({ name: 'barcode_data', type: 'text', nullable: true })
  barcodeData: string | null;

  @Column({ name: 'issued_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt: Date;

  @Column({ name: 'download_url', type: 'varchar', nullable: true })
  downloadUrl: string | null;

  @Column({ name: 'is_cancelled', type: 'boolean', default: false })
  isCancelled: boolean;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'receipt_items', schema: 'e_schooling' })
export class ReceiptItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'fee_receipt_id', type: 'bigint' })
  feeReceiptId: string;

  @Column({ name: 'fee_head_name', type: 'varchar' })
  feeHeadName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'discounts', schema: 'e_schooling' })
export class Discount {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'student_id', type: 'bigint', nullable: true })
  studentId: string | null;

  @Column({ name: 'class_id', type: 'bigint', nullable: true })
  classId: string | null;

  @Column({ name: 'section_id', type: 'bigint', nullable: true })
  sectionId: string | null;

  @Column({ name: 'fee_head_id', type: 'bigint', nullable: true })
  feeHeadId: string | null;

  @Column({ name: 'discount_type', type: 'varchar', default: 'FIXED' })
  discountType: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  value: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'approved_by', type: 'varchar', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'is_approved', type: 'boolean', default: true })
  isApproved: boolean;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'scholarships', schema: 'e_schooling' })
export class Scholarship {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'approved_by', type: 'varchar', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'applied_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'concessions', schema: 'e_schooling' })
export class Concession {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @Column({ name: 'invoice_id', type: 'varchar', nullable: true })
  invoiceId: string | null;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'approved_by', type: 'varchar', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'applied_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fines', schema: 'e_schooling' })
export class Fine {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'waived_amount', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  waivedAmount: number;

  @Column({ name: 'waived_by', type: 'varchar', nullable: true })
  waivedBy: string | null;

  @Column({ name: 'is_waived', type: 'boolean', default: false })
  isWaived: boolean;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'refunds', schema: 'e_schooling' })
export class Refund {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'payment_id', type: 'varchar' })
  paymentId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', default: 'PENDING_APPROVAL' })
  status: string;

  @Column({ name: 'authorized_by', type: 'varchar', nullable: true })
  authorizedBy: string | null;

  @Column({ name: 'requested_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'advance_balances', schema: 'e_schooling' })
export class AdvanceBalance {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'student_id', type: 'bigint' })
  studentId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  amount: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'reminder_templates', schema: 'e_schooling' })
export class ReminderTemplate {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', default: 'SMS' })
  channel: string;

  @Column({ name: 'template_content', type: 'text' })
  templateContent: string;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'reminder_logs', schema: 'e_schooling' })
export class ReminderLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'student_id', type: 'bigint', nullable: true })
  studentId: string | null;

  @Column({ name: 'invoice_id', type: 'varchar', nullable: true })
  invoiceId: string | null;

  @Column({ type: 'varchar', default: 'SMS' })
  channel: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', default: 'SENT' })
  status: string;

  @Column({ name: 'sent_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_settings', schema: 'e_schooling' })
export class FeeSetting {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ type: 'varchar' })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity({ name: 'fee_audit_logs', schema: 'e_schooling' })
export class FeeAuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'school_id', type: 'bigint' })
  schoolId: string;

  @Index()
  @Column({ name: 'academic_session_id', type: 'bigint' })
  academicSessionId: string;

  @Column({ name: 'action_type', type: 'varchar' })
  actionType: string;

  @Column({ name: 'entity_name', type: 'varchar' })
  entityName: string;

  @Column({ name: 'entity_id', type: 'bigint' })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @Column({ name: 'performed_by', type: 'bigint', nullable: true })
  performedBy: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
