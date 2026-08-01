import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  FeeHead,
  FeeStructure,
  FeeStructureItem,
  FeeAssignment,
  FeeSchedule,
  FeeScheduleInstallment,
  StudentFeeLedger,
  FeePayment,
  PaymentAllocation,
  FeeReceipt,
  ReceiptItem,
  Discount,
  Scholarship,
  Concession,
  Fine,
  Refund,
  AdvanceBalance,
  ReminderTemplate,
  ReminderLog,
  FeeSetting,
  FeeAuditLog,
} from '../../models/entities/finance/fee.entity';
import { Student } from '../../models/entities/student/student.entity';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { AcademicSession } from '../../models/entities/academic/academic-session.entity';

@Injectable()
export class FeesService {
  private feeHeadRepo: Repository<FeeHead>;
  private feeStructureRepo: Repository<FeeStructure>;
  private feeStructureItemRepo: Repository<FeeStructureItem>;
  private feeAssignmentRepo: Repository<FeeAssignment>;
  private feeScheduleRepo: Repository<FeeSchedule>;
  private feeScheduleInstallmentRepo: Repository<FeeScheduleInstallment>;
  private studentFeeLedgerRepo: Repository<StudentFeeLedger>;
  private feePaymentRepo: Repository<FeePayment>;
  private paymentAllocationRepo: Repository<PaymentAllocation>;
  private feeReceiptRepo: Repository<FeeReceipt>;
  private receiptItemRepo: Repository<ReceiptItem>;
  private discountRepo: Repository<Discount>;
  private scholarshipRepo: Repository<Scholarship>;
  private concessionRepo: Repository<Concession>;
  private fineRepo: Repository<Fine>;
  private refundRepo: Repository<Refund>;
  private advanceBalanceRepo: Repository<AdvanceBalance>;
  private reminderTemplateRepo: Repository<ReminderTemplate>;
  private reminderLogRepo: Repository<ReminderLog>;
  private feeSettingRepo: Repository<FeeSetting>;
  private feeAuditLogRepo: Repository<FeeAuditLog>;
  private studentRepo: Repository<Student>;
  private classRepo: Repository<Class>;
  private sectionRepo: Repository<Section>;
  private sessionRepo: Repository<AcademicSession>;

  constructor(private dataSource: DataSource) {
    this.feeHeadRepo = this.dataSource.getRepository(FeeHead);
    this.feeStructureRepo = this.dataSource.getRepository(FeeStructure);
    this.feeStructureItemRepo = this.dataSource.getRepository(FeeStructureItem);
    this.feeAssignmentRepo = this.dataSource.getRepository(FeeAssignment);
    this.feeScheduleRepo = this.dataSource.getRepository(FeeSchedule);
    this.feeScheduleInstallmentRepo = this.dataSource.getRepository(FeeScheduleInstallment);
    this.studentFeeLedgerRepo = this.dataSource.getRepository(StudentFeeLedger);
    this.feePaymentRepo = this.dataSource.getRepository(FeePayment);
    this.paymentAllocationRepo = this.dataSource.getRepository(PaymentAllocation);
    this.feeReceiptRepo = this.dataSource.getRepository(FeeReceipt);
    this.receiptItemRepo = this.dataSource.getRepository(ReceiptItem);
    this.discountRepo = this.dataSource.getRepository(Discount);
    this.scholarshipRepo = this.dataSource.getRepository(Scholarship);
    this.concessionRepo = this.dataSource.getRepository(Concession);
    this.fineRepo = this.dataSource.getRepository(Fine);
    this.refundRepo = this.dataSource.getRepository(Refund);
    this.advanceBalanceRepo = this.dataSource.getRepository(AdvanceBalance);
    this.reminderTemplateRepo = this.dataSource.getRepository(ReminderTemplate);
    this.reminderLogRepo = this.dataSource.getRepository(ReminderLog);
    this.feeSettingRepo = this.dataSource.getRepository(FeeSetting);
    this.feeAuditLogRepo = this.dataSource.getRepository(FeeAuditLog);
    this.studentRepo = this.dataSource.getRepository(Student);
    this.classRepo = this.dataSource.getRepository(Class);
    this.sectionRepo = this.dataSource.getRepository(Section);
    this.sessionRepo = this.dataSource.getRepository(AcademicSession);
  }

  private async resolveSessionId(schoolId: string, academicSessionId?: string): Promise<string> {
    if (academicSessionId && academicSessionId !== 'undefined' && academicSessionId !== 'null') {
      return academicSessionId;
    }
    const currentSession = await this.sessionRepo.findOne({
      where: { schoolId, isCurrent: true, isActive: true },
    });
    if (!currentSession) {
      throw new BadRequestException('No active academic session resolved for this school.');
    }
    return currentSession.id;
  }

  private async writeAuditLog(
    schoolId: string,
    academicSessionId: string,
    actionType: string,
    entityName: string,
    entityId: string,
    payload: any,
  ) {
    const log = new FeeAuditLog();
    log.schoolId = schoolId;
    log.academicSessionId = academicSessionId;
    log.actionType = actionType;
    log.entityName = entityName;
    log.entityId = entityId;
    log.payload = payload;
    await this.feeAuditLogRepo.save(log);
  }

  // --- Fee Categories / Heads ---
  async getFeeCategories(schoolId: string, academicSessionId?: string): Promise<FeeHead[]> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    return this.feeHeadRepo.find({
      where: { schoolId, academicSessionId: sessId },
      order: { displayOrder: 'ASC' },
    });
  }

  async createFeeCategory(
    schoolId: string,
    academicSessionId: string | undefined,
    payload: { name: string; code: string; description?: string },
  ): Promise<FeeHead> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const newHead = new FeeHead();
    newHead.schoolId = schoolId;
    newHead.academicSessionId = sessId;
    newHead.name = payload.name;
    newHead.code = payload.code.toUpperCase();
    newHead.category = 'TUITION';
    newHead.description = payload.description || '';
    newHead.isMandatory = true;
    newHead.isRefundable = false;
    newHead.isTaxable = false;
    newHead.isActive = true;
    newHead.displayOrder = 0;

    const saved = await this.feeHeadRepo.save(newHead);
    await this.writeAuditLog(schoolId, sessId, 'CATEGORY_CREATE', 'fee_heads', saved.id, payload);
    return saved;
  }

  // --- Fee Structures ---
  async getFeeStructures(schoolId: string, academicSessionId?: string): Promise<any[]> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const structures = await this.feeStructureRepo.find({
      where: { schoolId, academicSessionId: sessId },
      order: { createdAt: 'DESC' },
    });

    const enriched: any[] = [];
    for (const struct of structures) {
      const items = await this.feeStructureItemRepo.find({
        where: { feeStructureId: struct.id, schoolId },
      });
      const installments = await this.feeScheduleInstallmentRepo.find({
        where: { feeStructureId: struct.id, schoolId },
        order: { dueDate: 'ASC' },
      });
      
      const classObj = struct.classId ? await this.classRepo.findOne({ where: { id: struct.classId } }) : null;

      enriched.push({
        id: struct.id,
        schoolId: struct.schoolId,
        academicYearId: sessId,
        academicYearName: struct.name.includes('202') ? struct.name.match(/202\d-\d+/)?.[0] || '2026-27' : '2026-27',
        name: struct.name,
        classId: struct.classId,
        className: classObj ? classObj.name : 'All Classes',
        planType: struct.planType,
        totalAmount: Number(struct.totalAmount),
        status: struct.status,
        heads: items.map((it) => ({
          id: it.id,
          categoryId: it.feeHeadId,
          name: 'Fee Head',
          amount: Number(it.amount),
          isOptional: it.isOptional,
        })),
        installments: installments.map((inst) => ({
          id: inst.id,
          name: inst.name,
          dueDate: inst.dueDate,
          amount: Number(inst.amount),
        })),
        createdAt: struct.createdAt,
      });
    }
    return enriched;
  }

  async createFeeStructure(
    schoolId: string,
    academicSessionId: string | undefined,
    payload: {
      name: string;
      planType: string;
      classId?: string;
      className?: string;
      totalAmount: number;
      installmentCount: number;
    },
  ): Promise<any> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const struct = new FeeStructure();
    struct.schoolId = schoolId;
    struct.academicSessionId = sessId;
    struct.name = payload.name;
    struct.planType = payload.planType;
    struct.classId = payload.classId || null;
    struct.totalAmount = payload.totalAmount;
    struct.status = 'ACTIVE';

    const savedStruct = await this.feeStructureRepo.save(struct);

    // Create a default fee head link
    let defaultHead = await this.feeHeadRepo.findOne({
      where: { schoolId, academicSessionId: sessId, code: 'TUITION' },
    });
    if (!defaultHead) {
      defaultHead = new FeeHead();
      defaultHead.schoolId = schoolId;
      defaultHead.academicSessionId = sessId;
      defaultHead.name = 'Tuition Fee';
      defaultHead.code = 'TUITION';
      defaultHead.category = 'TUITION';
      defaultHead.isActive = true;
      defaultHead = await this.feeHeadRepo.save(defaultHead);
    }

    const item = new FeeStructureItem();
    item.schoolId = schoolId;
    item.academicSessionId = sessId;
    item.feeStructureId = savedStruct.id;
    item.feeHeadId = defaultHead.id;
    item.amount = payload.totalAmount;
    item.isOptional = false;
    await this.feeStructureItemRepo.save(item);

    // Create schedule and installments
    const schedule = new FeeSchedule();
    schedule.schoolId = schoolId;
    schedule.academicSessionId = sessId;
    schedule.feeStructureId = savedStruct.id;
    schedule.scheduleType = payload.planType;
    schedule.dueDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];
    await this.feeScheduleRepo.save(schedule);

    const instCount = Math.max(payload.installmentCount || 1, 1);
    const installmentAmount = Math.round(payload.totalAmount / instCount);
    const installments: any[] = [];

    for (let i = 0; i < instCount; i++) {
      const instDate = new Date();
      instDate.setMonth(instDate.getMonth() + i + 1);
      const isLast = i === instCount - 1;
      const amt = isLast
        ? payload.totalAmount - installmentAmount * (instCount - 1)
        : installmentAmount;

      const inst = new FeeScheduleInstallment();
      inst.schoolId = schoolId;
      inst.academicSessionId = sessId;
      inst.feeStructureId = savedStruct.id;
      inst.name = `Installment ${i + 1}`;
      inst.dueDate = instDate.toISOString().split('T')[0];
      inst.amount = amt;
      installments.push(await this.feeScheduleInstallmentRepo.save(inst));
    }

    await this.writeAuditLog(schoolId, sessId, 'STRUCTURE_CREATE', 'fee_structures', savedStruct.id, payload);

    return {
      ...savedStruct,
      heads: [{ id: item.id, categoryId: defaultHead.id, name: defaultHead.name, amount: payload.totalAmount, isOptional: false }],
      installments,
    };
  }

  async updateFeeStructure(
    schoolId: string,
    id: string,
    payload: any,
  ): Promise<any> {
    const struct = await this.feeStructureRepo.findOne({ where: { id, schoolId } });
    if (!struct) throw new NotFoundException('Fee structure not found');

    if (payload.name) struct.name = payload.name;
    if (payload.status) struct.status = payload.status;
    const saved = await this.feeStructureRepo.save(struct);

    await this.writeAuditLog(schoolId, struct.academicSessionId, 'STRUCTURE_UPDATE', 'fee_structures', id, payload);
    return saved;
  }

  async deleteFeeStructure(schoolId: string, id: string): Promise<boolean> {
    const struct = await this.feeStructureRepo.findOne({ where: { id, schoolId } });
    if (!struct) throw new NotFoundException('Fee structure not found');

    // Business Rule check: Prevent deleting fee structures that have student assignments
    const assignmentsCount = await this.feeAssignmentRepo.count({
      where: { feeStructureId: id, schoolId },
    });
    if (assignmentsCount > 0) {
      throw new BadRequestException('Cannot delete fee structure that is currently assigned to students.');
    }

    await this.feeStructureRepo.softRemove(struct);
    await this.writeAuditLog(schoolId, struct.academicSessionId, 'STRUCTURE_DELETE', 'fee_structures', id, null);
    return true;
  }

  // --- Assign Fees to Students ---
  async assignFeesToStudents(
    schoolId: string,
    academicSessionId: string | undefined,
    payload: { structureId: string; studentIds: string[] },
  ): Promise<any[]> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const structure = await this.feeStructureRepo.findOne({ where: { id: payload.structureId, schoolId } });
    if (!structure) throw new NotFoundException('Fee structure not found');

    const createdInvoices: any[] = [];

    for (const studentId of payload.studentIds) {
      // 1. Create fee assignment record
      const assignment = new FeeAssignment();
      assignment.schoolId = schoolId;
      assignment.academicSessionId = sessId;
      assignment.feeStructureId = structure.id;
      assignment.studentId = studentId;
      assignment.assignedAt = new Date();
      await this.feeAssignmentRepo.save(assignment);

      // Resolve student info
      const student = await this.studentRepo.findOne({ where: { id: studentId } });
      const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : `Student ${studentId}`;
      const studentCode = student ? student.studentCode : `STU${studentId}`;

      // 2. Generate Debit Ledger entry
      const ledgerDebit = new StudentFeeLedger();
      ledgerDebit.schoolId = schoolId;
      ledgerDebit.academicSessionId = sessId;
      ledgerDebit.studentId = studentId;
      ledgerDebit.feeStructureId = structure.id;
      ledgerDebit.transactionType = 'DEBIT';
      ledgerDebit.entryType = 'TUITION_GENERATED';
      ledgerDebit.amount = structure.totalAmount;
      ledgerDebit.description = `Fee Structure ${structure.name} assigned`;
      const savedLedger = await this.studentFeeLedgerRepo.save(ledgerDebit);

      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const count = await this.studentFeeLedgerRepo.count({
        where: { schoolId, transactionType: 'DEBIT', entryType: 'TUITION_GENERATED' },
      });
      const invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(5, '0')}`;

      // Update ledger with invoice number
      savedLedger.invoiceNumber = invoiceNumber;
      await this.studentFeeLedgerRepo.save(savedLedger);

      createdInvoices.push({
        id: savedLedger.id,
        schoolId,
        studentId,
        studentName,
        studentCode,
        className: 'Class 10',
        structureId: structure.id,
        invoiceNumber,
        academicYearName: '2026-27',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        totalAmount: Number(structure.totalAmount),
        paidAmount: 0,
        concessionAmount: 0,
        scholarshipAmount: 0,
        fineAmount: 0,
        outstandingAmount: Number(structure.totalAmount),
        status: 'PENDING',
      });
    }

    await this.writeAuditLog(schoolId, sessId, 'FEES_ASSIGN', 'fee_assignments', payload.structureId, payload);
    return createdInvoices;
  }

  // --- Collect Payment ---
  async collectPayment(
    schoolId: string,
    academicSessionId: string | undefined,
    payload: {
      studentId: string;
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      transactionReference?: string;
    },
  ): Promise<any> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);

    if (payload.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const ledgerDebit = await this.studentFeeLedgerRepo.findOne({
      where: { id: payload.invoiceId, schoolId },
    });
    if (!ledgerDebit) throw new NotFoundException('Invoice/ledger debit entry not found.');

    const invoices = await this.compileInvoices(schoolId, sessId);
    const match = invoices.find((inv) => inv.id === payload.invoiceId);
    if (!match) throw new NotFoundException('Resolved invoice details not found.');

    if (payload.amount > match.outstandingAmount) {
      const excess = payload.amount - match.outstandingAmount;
      if (excess > 0) {
        const adv = new AdvanceBalance();
        adv.schoolId = schoolId;
        adv.academicSessionId = sessId;
        adv.studentId = payload.studentId;
        adv.amount = excess;
        await this.advanceBalanceRepo.save(adv);

        payload.amount = match.outstandingAmount;
      }
    }

    const currentYear = new Date().getFullYear();
    const countReceipts = await this.feeReceiptRepo.count({ where: { schoolId } });
    const receiptNumber = `RCPT-${currentYear}-${String(countReceipts + 1).padStart(5, '0')}`;

    // Create payment entry
    const payment = new FeePayment();
    payment.schoolId = schoolId;
    payment.academicSessionId = sessId;
    payment.studentId = payload.studentId;
    payment.invoiceId = payload.invoiceId;
    payment.amount = payload.amount;
    payment.paymentMethod = payload.paymentMethod;
    payment.transactionReference = payload.transactionReference || '';
    payment.paidAt = new Date();
    payment.status = 'PAID';
    const savedPayment = await this.feePaymentRepo.save(payment);

    // Create receipt entry
    const receipt = new FeeReceipt();
    receipt.schoolId = schoolId;
    receipt.academicSessionId = sessId;
    receipt.feePaymentId = savedPayment.id;
    receipt.receiptNumber = receiptNumber;
    receipt.issuedAt = new Date();
    receipt.downloadUrl = `/receipts/${receiptNumber}.pdf`;
    const savedReceipt = await this.feeReceiptRepo.save(receipt);

    // Update payment with receiptId
    savedPayment.receiptId = savedReceipt.id;
    await this.feePaymentRepo.save(savedPayment);

    // Create credit ledger entry
    const creditLedger = new StudentFeeLedger();
    creditLedger.schoolId = schoolId;
    creditLedger.academicSessionId = sessId;
    creditLedger.studentId = payload.studentId;
    creditLedger.feeStructureId = ledgerDebit.feeStructureId;
    creditLedger.invoiceNumber = ledgerDebit.invoiceNumber;
    creditLedger.transactionType = 'CREDIT';
    creditLedger.entryType = 'PAYMENT';
    creditLedger.amount = payload.amount;
    creditLedger.description = `Payment received via ${payload.paymentMethod}`;
    creditLedger.referenceId = savedPayment.id;
    await this.studentFeeLedgerRepo.save(creditLedger);

    await this.writeAuditLog(schoolId, sessId, 'PAYMENT_COLLECT', 'fee_payments', savedPayment.id, payload);

    return {
      success: true,
      message: 'Payment received successfully',
      data: {
        paymentId: savedPayment.id,
        receiptNumber,
        status: 'PAID',
      },
    };
  }

  // --- Initiate Online Payment ---
  async initiateOnlinePayment(schoolId: string, academicSessionId: string | undefined, payload: any): Promise<any> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    return {
      orderId: `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  async getPaymentDetails(schoolId: string, paymentId: string): Promise<any> {
    return this.feePaymentRepo.findOne({ where: { id: paymentId, schoolId } });
  }

  // --- Concessions & Scholarships ---
  async applyConcession(
    schoolId: string,
    academicSessionId: string | undefined,
    payload: { invoiceId: string; studentId: string; amount: number; reason: string; approvedBy: string },
  ): Promise<Concession> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const ledgerDebit = await this.studentFeeLedgerRepo.findOne({ where: { id: payload.invoiceId, schoolId } });
    if (!ledgerDebit) throw new NotFoundException('Invoice not found');

    const concession = new Concession();
    concession.schoolId = schoolId;
    concession.academicSessionId = sessId;
    concession.studentId = payload.studentId;
    concession.invoiceId = payload.invoiceId;
    concession.reason = payload.reason;
    concession.amount = payload.amount;
    concession.approvedBy = payload.approvedBy;
    concession.appliedAt = new Date();
    const saved = await this.concessionRepo.save(concession);

    // Create credit ledger entry
    const creditLedger = new StudentFeeLedger();
    creditLedger.schoolId = schoolId;
    creditLedger.academicSessionId = sessId;
    creditLedger.studentId = payload.studentId;
    creditLedger.feeStructureId = ledgerDebit.feeStructureId;
    creditLedger.invoiceNumber = ledgerDebit.invoiceNumber;
    creditLedger.transactionType = 'CREDIT';
    creditLedger.entryType = 'CONCESSION';
    creditLedger.amount = payload.amount;
    creditLedger.description = `Concession: ${payload.reason}`;
    creditLedger.referenceId = saved.id;
    await this.studentFeeLedgerRepo.save(creditLedger);

    await this.writeAuditLog(schoolId, sessId, 'CONCESSION_APPLY', 'concessions', saved.id, payload);
    return saved;
  }

  async applyScholarship(
    schoolId: string,
    academicSessionId: string | undefined,
    payload: { invoiceId: string; studentId: string; amount: number; title: string; approvedBy: string },
  ): Promise<Scholarship> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const ledgerDebit = await this.studentFeeLedgerRepo.findOne({ where: { id: payload.invoiceId, schoolId } });
    if (!ledgerDebit) throw new NotFoundException('Invoice not found');

    const scholarship = new Scholarship();
    scholarship.schoolId = schoolId;
    scholarship.academicSessionId = sessId;
    scholarship.studentId = payload.studentId;
    scholarship.title = payload.title;
    scholarship.amount = payload.amount;
    scholarship.approvedBy = payload.approvedBy;
    scholarship.appliedAt = new Date();
    const saved = await this.scholarshipRepo.save(scholarship);

    // Create credit ledger entry
    const creditLedger = new StudentFeeLedger();
    creditLedger.schoolId = schoolId;
    creditLedger.academicSessionId = sessId;
    creditLedger.studentId = payload.studentId;
    creditLedger.feeStructureId = ledgerDebit.feeStructureId;
    creditLedger.invoiceNumber = ledgerDebit.invoiceNumber;
    creditLedger.transactionType = 'CREDIT';
    creditLedger.entryType = 'SCHOLARSHIP';
    creditLedger.amount = payload.amount;
    creditLedger.description = `Scholarship: ${payload.title}`;
    creditLedger.referenceId = saved.id;
    await this.studentFeeLedgerRepo.save(creditLedger);

    await this.writeAuditLog(schoolId, sessId, 'SCHOLARSHIP_APPLY', 'scholarships', saved.id, payload);
    return saved;
  }

  // --- Refunds ---
  async createRefund(
    schoolId: string,
    academicSessionId: string | undefined,
    payload: { paymentId: string; amount: number; reason: string; authorizedBy: string },
  ): Promise<Refund> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const payment = await this.feePaymentRepo.findOne({ where: { id: payload.paymentId, schoolId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payload.amount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed payment amount.');
    }

    const refund = new Refund();
    refund.schoolId = schoolId;
    refund.academicSessionId = sessId;
    refund.paymentId = payload.paymentId;
    refund.amount = payload.amount;
    refund.reason = payload.reason;
    refund.status = 'APPROVED';
    refund.authorizedBy = payload.authorizedBy;
    refund.requestedAt = new Date();
    const saved = await this.refundRepo.save(refund);

    const ledgerDebit = await this.studentFeeLedgerRepo.findOne({ where: { id: payment.invoiceId || undefined } });

    const refundDebit = new StudentFeeLedger();
    refundDebit.schoolId = schoolId;
    refundDebit.academicSessionId = sessId;
    refundDebit.studentId = payment.studentId;
    refundDebit.feeStructureId = ledgerDebit?.feeStructureId || null;
    refundDebit.invoiceNumber = ledgerDebit?.invoiceNumber || null;
    refundDebit.transactionType = 'DEBIT';
    refundDebit.entryType = 'ADDITIONAL_CHARGE';
    refundDebit.amount = payload.amount;
    refundDebit.description = `Refund adjustment: ${payload.reason}`;
    refundDebit.referenceId = saved.id;
    await this.studentFeeLedgerRepo.save(refundDebit);

    await this.writeAuditLog(schoolId, sessId, 'REFUND_CREATE', 'refunds', saved.id, payload);
    return saved;
  }

  // --- Due Reminders ---
  async sendDueReminders(schoolId: string, academicSessionId?: string): Promise<any[]> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const invoices = await this.compileInvoices(schoolId, sessId);
    const outstanding = invoices.filter((inv) => inv.outstandingAmount > 0);

    const logs: any[] = [];
    for (const inv of outstanding) {
      const msg = `Fee reminder for ${inv.studentName} (Invoice: ${inv.invoiceNumber}): Outstanding amount is INR ${inv.outstandingAmount}. Please pay by due date.`;
      const log = new ReminderLog();
      log.schoolId = schoolId;
      log.academicSessionId = sessId;
      log.studentId = inv.studentId;
      log.invoiceId = inv.id;
      log.channel = 'SMS';
      log.message = msg;
      log.status = 'SENT';
      log.sentAt = new Date();
      logs.push(await this.reminderLogRepo.save(log));
    }
    return logs;
  }

  // --- Dynamic Invoice Compilation ---
  private async compileInvoices(schoolId: string, academicSessionId: string): Promise<any[]> {
    const debits = await this.studentFeeLedgerRepo.find({
      where: { schoolId, academicSessionId, transactionType: 'DEBIT', entryType: 'TUITION_GENERATED' },
      order: { createdAt: 'DESC' },
    });

    const session = await this.sessionRepo.findOne({ where: { id: academicSessionId } });
    const academicYearName = session ? session.name : '2026-27';

    const list: any[] = [];
    for (const d of debits) {
      const student = await this.studentRepo.findOne({ where: { id: d.studentId } });
      const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : `Student ${d.studentId}`;
      const studentCode = student ? student.studentCode : `STU${d.studentId}`;

      const structure = d.feeStructureId
        ? await this.feeStructureRepo.findOne({ where: { id: d.feeStructureId } })
        : null;

      let className = 'General';
      if (structure && structure.classId) {
        const cls = await this.classRepo.findOne({ where: { id: structure.classId } });
        if (cls) className = cls.name;
      }

      const schedule = d.feeStructureId
        ? await this.feeScheduleRepo.findOne({ where: { feeStructureId: d.feeStructureId } })
        : null;

      const dueDateStr = schedule
        ? schedule.dueDate
        : new Date(d.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const related = await this.studentFeeLedgerRepo.find({
        where: { schoolId, academicSessionId, studentId: d.studentId, invoiceNumber: d.invoiceNumber || undefined },
      });

      let totalAmount = Number(d.amount);
      let paidAmount = 0;
      let concessionAmount = 0;
      let scholarshipAmount = 0;
      let fineAmount = 0;

      for (const r of related) {
        if (r.id === d.id) continue;
        if (r.transactionType === 'CREDIT') {
          if (r.entryType === 'PAYMENT') paidAmount += Number(r.amount);
          if (r.entryType === 'CONCESSION') concessionAmount += Number(r.amount);
          if (r.entryType === 'SCHOLARSHIP') scholarshipAmount += Number(r.amount);
        } else if (r.transactionType === 'DEBIT') {
          if (r.entryType === 'FINE') fineAmount += Number(r.amount);
          if (r.entryType === 'ADDITIONAL_CHARGE') totalAmount += Number(r.amount);
        }
      }

      const outstandingAmount = Math.max(totalAmount + fineAmount - concessionAmount - scholarshipAmount - paidAmount, 0);
      const isOverdue = outstandingAmount > 0 && new Date(dueDateStr) < new Date();

      list.push({
        id: d.id,
        schoolId,
        studentId: d.studentId,
        studentName,
        studentCode,
        className,
        structureId: d.feeStructureId,
        invoiceNumber: d.invoiceNumber || `INV-2026-00000`,
        academicYearName,
        issueDate: d.createdAt.toISOString().split('T')[0],
        dueDate: dueDateStr,
        totalAmount,
        paidAmount,
        concessionAmount,
        scholarshipAmount,
        fineAmount,
        outstandingAmount,
        status: outstandingAmount <= 0 ? 'PAID' : isOverdue ? 'OVERDUE' : paidAmount > 0 ? 'PARTIAL' : 'PENDING',
      });
    }

    return list;
  }

  // --- Reports & Analytics ---
  async getFeeAnalytics(schoolId: string, academicSessionId?: string): Promise<any> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const invoices = await this.compileInvoices(schoolId, sessId);
    const payments = await this.feePaymentRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const refunds = await this.refundRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const concessions = await this.concessionRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const scholarships = await this.scholarshipRepo.find({ where: { schoolId, academicSessionId: sessId } });

    const totalBillable = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collectedAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);
    const overdueAmount = invoices.filter((inv) => inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.outstandingAmount, 0);
    const overdueInvoices = invoices.filter((inv) => inv.status === 'OVERDUE').length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID').length;

    const paymentModeBreakdown = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      CHEQUE: 0,
      ONLINE: 0,
    };
    payments.forEach((p) => {
      const method = p.paymentMethod as keyof typeof paymentModeBreakdown;
      if (paymentModeBreakdown[method] !== undefined) {
        paymentModeBreakdown[method] += Number(p.amount);
      }
    });

    return {
      totalBillable,
      collectedAmount,
      outstandingAmount,
      overdueAmount,
      collectionRate: totalBillable ? Math.round((collectedAmount / totalBillable) * 100) : 0,
      concessionsAmount: concessions.reduce((sum, item) => sum + Number(item.amount), 0),
      scholarshipsAmount: scholarships.reduce((sum, item) => sum + Number(item.amount), 0),
      refundsAmount: refunds.reduce((sum, item) => sum + Number(item.amount), 0),
      overdueInvoices,
      paidInvoices,
      paymentModeBreakdown,
      monthlyRevenue: [
        { month: 'Jul 26', amount: collectedAmount },
      ],
    };
  }

  async getFeeReports(schoolId: string, academicSessionId?: string): Promise<any> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const analytics = await this.getFeeAnalytics(schoolId, sessId);
    const structures = await this.getFeeStructures(schoolId, sessId);

    return {
      dailyCollection: analytics.collectedAmount,
      outstandingDues: analytics.outstandingAmount,
      installmentWiseCollection: structures.flatMap((st) =>
        st.installments.map((inst: any) => ({
          installment: `${st.className} ${inst.name}`,
          amount: Math.round(inst.amount * analytics.collectionRate * 0.01),
        })),
      ),
      scholarshipAndConcession: analytics.concessionsAmount + analytics.scholarshipsAmount,
      refundTotal: analytics.refundsAmount,
      paymentModeAnalysis: analytics.paymentModeBreakdown,
      monthlyRevenue: analytics.monthlyRevenue,
      yearlyRevenue: analytics.collectedAmount,
    };
  }

  // --- Fee Workspace Aggregated Getter ---
  async getFeeWorkspace(schoolId: string, academicSessionId?: string): Promise<any> {
    const sessId = await this.resolveSessionId(schoolId, academicSessionId);
    const categories = await this.getFeeCategories(schoolId, sessId);
    const structures = await this.getFeeStructures(schoolId, sessId);
    const invoices = await this.compileInvoices(schoolId, sessId);
    const payments = await this.feePaymentRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const receipts = await this.feeReceiptRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const refunds = await this.refundRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const concessions = await this.concessionRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const scholarships = await this.scholarshipRepo.find({ where: { schoolId, academicSessionId: sessId } });
    const analytics = await this.getFeeAnalytics(schoolId, sessId);
    const reports = await this.getFeeReports(schoolId, sessId);

    const formattedPayments: any[] = [];
    for (const p of payments) {
      const student = await this.studentRepo.findOne({ where: { id: p.studentId } });
      const rcpt = await this.feeReceiptRepo.findOne({ where: { feePaymentId: p.id } });
      formattedPayments.push({
        id: p.id,
        schoolId: p.schoolId,
        studentId: p.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}`.trim() : `Student ${p.studentId}`,
        invoiceId: p.invoiceId,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
        paidAt: p.paidAt.toISOString(),
        status: p.status,
        receiptId: rcpt ? rcpt.id : null,
        receiptNumber: rcpt ? rcpt.receiptNumber : null,
      });
    }

    const formattedReceipts = receipts.map((r) => ({
      id: r.id,
      schoolId: r.schoolId,
      paymentId: r.feePaymentId,
      invoiceId: 'n/a',
      receiptNumber: r.receiptNumber,
      studentName: 'Student Detail',
      amount: 0,
      issuedAt: r.issuedAt.toISOString(),
      downloadUrl: r.downloadUrl,
    }));

    return {
      categories: categories.map((cat) => ({
        id: cat.id,
        schoolId: cat.schoolId,
        name: cat.name,
        code: cat.code,
        description: cat.description || '',
        isActive: cat.isActive,
      })),
      structures,
      invoices,
      payments: formattedPayments,
      receipts: formattedReceipts,
      refunds: refunds.map((rf) => ({
        id: rf.id,
        schoolId: rf.schoolId,
        paymentId: rf.paymentId,
        studentName: 'Refund Record',
        amount: Number(rf.amount),
        reason: rf.reason || '',
        status: rf.status,
        requestedAt: rf.requestedAt.toISOString(),
        authorizedBy: rf.authorizedBy || '',
      })),
      concessions: concessions.map((c) => ({
        id: c.id,
        schoolId: c.schoolId,
        studentId: c.studentId,
        studentName: 'Concession Holder',
        invoiceId: c.invoiceId,
        reason: c.reason,
        amount: Number(c.amount),
        approvedBy: c.approvedBy || '',
        appliedAt: c.appliedAt.toISOString(),
      })),
      scholarships: scholarships.map((s) => ({
        id: s.id,
        schoolId: s.schoolId,
        studentId: s.studentId,
        studentName: 'Scholarship Holder',
        invoiceId: 'n/a',
        title: s.title,
        amount: Number(s.amount),
        approvedBy: s.approvedBy || '',
        appliedAt: s.appliedAt.toISOString(),
      })),
      lateFeeRules: [
        { id: 'rule-standard', schoolId, name: 'Standard fine rule', graceDays: 5, amountPerDay: 50, maxAmount: 1000, isActive: true },
      ],
      reminders: [],
      analytics,
      reports,
    };
  }

  async getFeeSettings(schoolId: string, academicSessionId?: string) {
    const sessionId = await this.resolveSessionId(schoolId, academicSessionId).catch(() => '1');
    const settings = await this.feeSettingRepo.find({
      where: { schoolId, academicSessionId: sessionId },
    });

    const result: Record<string, any> = {
      invoicePrefix: '',
      receiptPrefix: '',
      startingInvoiceNo: 1,
      schoolTaxId: '',
      enableLateFee: false,
      gracePeriodDays: 0,
      fineType: 'FLAT',
      fineAmount: 0,
      maxFineAmount: 0,
      autoSmsReminders: false,
      autoEmailReminders: false,
      reminderDaysBeforeDue: 0,
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
    };

    for (const item of settings) {
      try {
        result[item.key] = JSON.parse(item.value);
      } catch {
        result[item.key] = item.value;
      }
    }

    return result;
  }

  async updateFeeSettings(schoolId: string, academicSessionId: string | undefined, payload: Record<string, any>) {
    const sessionId = await this.resolveSessionId(schoolId, academicSessionId).catch(() => '1');

    for (const [key, value] of Object.entries(payload)) {
      let setting = await this.feeSettingRepo.findOne({
        where: { schoolId, academicSessionId: sessionId, key },
      });

      if (!setting) {
        setting = this.feeSettingRepo.create({
          schoolId,
          academicSessionId: sessionId,
          key,
          value: JSON.stringify(value),
        });
      } else {
        setting.value = JSON.stringify(value);
      }

      await this.feeSettingRepo.save(setting);
    }

    return this.getFeeSettings(schoolId, academicSessionId);
  }
}
