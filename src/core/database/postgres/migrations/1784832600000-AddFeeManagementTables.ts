import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeeManagementTables1784832600000 implements MigrationInterface {
  name = 'AddFeeManagementTables1784832600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. fee_heads
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_heads" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "name" character varying NOT NULL,
        "code" character varying NOT NULL,
        "category" character varying NOT NULL,
        "description" text,
        "is_mandatory" boolean NOT NULL DEFAULT true,
        "is_refundable" boolean NOT NULL DEFAULT false,
        "is_taxable" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 2. fee_structures
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_structures" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "name" character varying NOT NULL,
        "plan_type" character varying NOT NULL DEFAULT 'ANNUAL',
        "class_id" bigint,
        "section_id" bigint,
        "student_id" bigint,
        "effective_date" date,
        "expiry_date" date,
        "total_amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 3. fee_structure_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_structure_items" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "fee_structure_id" bigint NOT NULL,
        "fee_head_id" bigint NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "is_optional" boolean NOT NULL DEFAULT false,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 4. fee_assignments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_assignments" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "fee_structure_id" bigint NOT NULL,
        "student_id" bigint,
        "class_id" bigint,
        "section_id" bigint,
        "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 5. fee_schedules
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_schedules" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "fee_structure_id" bigint NOT NULL,
        "schedule_type" character varying NOT NULL DEFAULT 'MONTHLY',
        "due_date" date NOT NULL,
        "grace_period_days" integer NOT NULL DEFAULT 0,
        "fine_rule_id" bigint,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 6. fee_schedule_installments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_schedule_installments" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "fee_structure_id" bigint NOT NULL,
        "name" character varying NOT NULL,
        "due_date" date NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 7. student_fee_ledgers
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."student_fee_ledgers" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "fee_structure_id" bigint,
        "invoice_number" character varying,
        "transaction_type" character varying NOT NULL, -- DEBIT | CREDIT
        "entry_type" character varying NOT NULL,       -- TUITION_GENERATED | TRANSPORT | FINE | ADDITIONAL_CHARGE | PAYMENT | SCHOLARSHIP | DISCOUNT | CONCESSION
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "description" text,
        "reference_id" bigint,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 8. fee_payments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_payments" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "invoice_id" character varying,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "payment_method" character varying NOT NULL DEFAULT 'CASH',
        "transaction_reference" character varying,
        "cheque_number" character varying,
        "bank_name" character varying,
        "remarks" text,
        "paid_at" TIMESTAMP NOT NULL DEFAULT now(),
        "status" character varying NOT NULL DEFAULT 'PAID',
        "receipt_id" bigint,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 9. payment_allocations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."payment_allocations" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "fee_payment_id" bigint NOT NULL,
        "fee_structure_item_id" bigint,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 10. fee_receipts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_receipts" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "fee_payment_id" bigint NOT NULL,
        "receipt_number" character varying NOT NULL,
        "qr_code_data" text,
        "barcode_data" text,
        "issued_at" TIMESTAMP NOT NULL DEFAULT now(),
        "download_url" character varying,
        "is_cancelled" boolean NOT NULL DEFAULT false,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 11. receipt_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."receipt_items" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "fee_receipt_id" bigint NOT NULL,
        "fee_head_name" character varying NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 12. discounts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."discounts" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint,
        "class_id" bigint,
        "section_id" bigint,
        "fee_head_id" bigint,
        "discount_type" character varying NOT NULL DEFAULT 'FIXED',
        "value" decimal(12,2) NOT NULL DEFAULT 0.00,
        "reason" text,
        "approved_by" character varying,
        "is_approved" boolean NOT NULL DEFAULT true,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 13. scholarships
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."scholarships" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "title" character varying NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "approved_by" character varying,
        "applied_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 14. concessions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."concessions" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "invoice_id" character varying,
        "reason" character varying NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "approved_by" character varying,
        "applied_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 15. fines
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fines" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "reason" text,
        "waived_amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "waived_by" character varying,
        "is_waived" boolean NOT NULL DEFAULT false,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 16. refunds
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."refunds" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "payment_id" character varying NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "reason" text,
        "status" character varying NOT NULL DEFAULT 'PENDING_APPROVAL',
        "authorized_by" character varying,
        "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 17. advance_balances
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."advance_balances" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint NOT NULL,
        "amount" decimal(12,2) NOT NULL DEFAULT 0.00,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 18. reminder_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."reminder_templates" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "name" character varying NOT NULL,
        "channel" character varying NOT NULL DEFAULT 'SMS',
        "template_content" text NOT NULL,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 19. reminder_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."reminder_logs" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "student_id" bigint,
        "invoice_id" character varying,
        "channel" character varying NOT NULL DEFAULT 'SMS',
        "message" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'SENT',
        "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 20. fee_settings
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_settings" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "key" character varying NOT NULL,
        "value" text NOT NULL,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // 21. fee_audit_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."fee_audit_logs" (
        "id" BIGSERIAL NOT NULL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint NOT NULL,
        "action_type" character varying NOT NULL,
        "entity_name" character varying NOT NULL,
        "entity_id" bigint NOT NULL,
        "payload" jsonb,
        "performed_by" bigint,
        "created_by" bigint,
        "updated_by" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      );
    `);

    // Create Indexes for isolated querying
    const tables = [
      'fee_heads', 'fee_structures', 'fee_structure_items', 'fee_assignments',
      'fee_schedules', 'fee_schedule_installments', 'student_fee_ledgers',
      'fee_payments', 'payment_allocations', 'fee_receipts', 'receipt_items',
      'discounts', 'scholarships', 'concessions', 'fines', 'refunds',
      'advance_balances', 'reminder_templates', 'reminder_logs', 'fee_settings',
      'fee_audit_logs'
    ];

    for (const table of tables) {
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_${table}_school_id" ON "e_schooling"."${table}" ("school_id");`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_${table}_academic_session_id" ON "e_schooling"."${table}" ("academic_session_id");`);
    }

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fee_structures_class_id" ON "e_schooling"."fee_structures" ("class_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_student_fee_ledgers_student_id" ON "e_schooling"."student_fee_ledgers" ("student_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fee_payments_student_id" ON "e_schooling"."fee_payments" ("student_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'fee_audit_logs', 'fee_settings', 'reminder_logs', 'reminder_templates',
      'advance_balances', 'refunds', 'fines', 'concessions', 'scholarships',
      'discounts', 'receipt_items', 'fee_receipts', 'payment_allocations',
      'fee_payments', 'student_fee_ledgers', 'fee_schedule_installments',
      'fee_schedules', 'fee_assignments', 'fee_structure_items',
      'fee_structures', 'fee_heads'
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "e_schooling"."${table}" CASCADE;`);
    }
  }
}
