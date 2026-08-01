import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

async function runSeed() {
  console.log('🚀 Initializing Database Connection for Fees Seeding...');
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource) {
    console.error('❌ Failed to create Data Source');
    process.exit(1);
  }

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  console.log('✅ Database connected successfully!');

  try {
    const schoolId = '2'; // default school in workspace

    // Resolve an academic session for school ID '2'
    const sessionRes = await dataSource.query(
      `SELECT id FROM "e_schooling"."academic_sessions" WHERE "school_id" = $1 AND "is_current" = true LIMIT 1`,
      [schoolId],
    );
    const academicSessionId = sessionRes[0]?.id || '1'; // fallback to 1

    console.log(`Academic Session ID resolved: ${academicSessionId}`);

    // Check if fee heads are already seeded
    const headsCountRes = await dataSource.query(
      `SELECT COUNT(*)::int as count FROM "e_schooling"."fee_heads" WHERE "school_id" = $1`,
      [schoolId],
    );
    const headsCount = headsCountRes[0]?.count || 0;

    if (headsCount > 0) {
      console.log('🌱 Fees tables already seeded. Skipping.');
      return;
    }

    console.log('🌱 Seeding Fee Heads / Categories...');
    const headTuition = await dataSource.query(`
      INSERT INTO "e_schooling"."fee_heads" (
        "school_id", "academic_session_id", "name", "code", "category", 
        "description", "is_mandatory", "is_refundable", "is_taxable", 
        "is_active", "display_order"
      ) VALUES (
        '${schoolId}', '${academicSessionId}', 'Tuition Fee', 'TUITION', 'TUITION',
        'Annual core academic tuition fee', true, false, false, true, 1
      ) RETURNING id;
    `);
    const tuitionHeadId = headTuition[0].id;

    const headTransport = await dataSource.query(`
      INSERT INTO "e_schooling"."fee_heads" (
        "school_id", "academic_session_id", "name", "code", "category", 
        "description", "is_mandatory", "is_refundable", "is_taxable", 
        "is_active", "display_order"
      ) VALUES (
        '${schoolId}', '${academicSessionId}', 'Transport Fee', 'TRANSPORT', 'TRANSPORT',
        'Bus route transportation fee', false, false, false, true, 2
      ) RETURNING id;
    `);
    const transportHeadId = headTransport[0].id;

    const headExam = await dataSource.query(`
      INSERT INTO "e_schooling"."fee_heads" (
        "school_id", "academic_session_id", "name", "code", "category", 
        "description", "is_mandatory", "is_refundable", "is_taxable", 
        "is_active", "display_order"
      ) VALUES (
        '${schoolId}', '${academicSessionId}', 'Examination Fee', 'EXAM', 'EXAMINATION',
        'Term assessments and evaluation fee', true, false, false, true, 3
      ) RETURNING id;
    `);
    const examHeadId = headExam[0].id;

    console.log('🌱 Seeding Fee Structures...');
    const structureClass10 = await dataSource.query(`
      INSERT INTO "e_schooling"."fee_structures" (
        "school_id", "academic_session_id", "name", "plan_type", 
        "class_id", "section_id", "student_id", "total_amount", "status"
      ) VALUES (
        '${schoolId}', '${academicSessionId}', 'Class 10 Annual Fee Plan', 'ANNUAL',
        1, NULL, NULL, 60000.00, 'ACTIVE'
      ) RETURNING id;
    `);
    const structId = structureClass10[0].id;

    console.log('🌱 Seeding Fee Structure Items...');
    await dataSource.query(`
      INSERT INTO "e_schooling"."fee_structure_items" (
        "school_id", "academic_session_id", "fee_structure_id", 
        "fee_head_id", "amount", "is_optional"
      ) VALUES 
      ('${schoolId}', '${academicSessionId}', '${structId}', '${tuitionHeadId}', 48000.00, false),
      ('${schoolId}', '${academicSessionId}', '${structId}', '${examHeadId}', 6000.00, false),
      ('${schoolId}', '${academicSessionId}', '${structId}', '${transportHeadId}', 6000.00, true);
    `);

    console.log('🌱 Seeding Fee Schedule & Installments...');
    const schedule = await dataSource.query(`
      INSERT INTO "e_schooling"."fee_schedules" (
        "school_id", "academic_session_id", "fee_structure_id", 
        "schedule_type", "due_date", "grace_period_days"
      ) VALUES (
        '${schoolId}', '${academicSessionId}', '${structId}', 'ANNUAL', '2026-08-10', 5
      ) RETURNING id;
    `);

    await dataSource.query(`
      INSERT INTO "e_schooling"."fee_schedule_installments" (
        "school_id", "academic_session_id", "fee_structure_id", 
        "name", "due_date", "amount"
      ) VALUES 
      ('${schoolId}', '${academicSessionId}', '${structId}', 'Quarter 1', '2026-07-10', 15000.00),
      ('${schoolId}', '${academicSessionId}', '${structId}', 'Quarter 2', '2026-10-10', 15000.00),
      ('${schoolId}', '${academicSessionId}', '${structId}', 'Quarter 3', '2027-01-10', 15000.00),
      ('${schoolId}', '${academicSessionId}', '${structId}', 'Quarter 4', '2027-04-10', 15000.00);
    `);

    // Fetch active students to assign fees to real database students
    console.log('🌱 Fetching active students from e_schooling.students...');
    const dbStudents = await dataSource.query(
      `SELECT id FROM "e_schooling"."students" WHERE "school_id" = $1 LIMIT 5`,
      [schoolId],
    );

    if (dbStudents.length === 0) {
      console.log('⚠️ No students found in database. Cannot create student fee assignments.');
      return;
    }

    console.log(`Found ${dbStudents.length} students to seed fees for.`);

    let invoiceCount = 0;
    for (const stud of dbStudents) {
      const studentId = stud.id;
      invoiceCount++;

      // Create fee assignment
      await dataSource.query(`
        INSERT INTO "e_schooling"."fee_assignments" (
          "school_id", "academic_session_id", "fee_structure_id", "student_id"
        ) VALUES (
          '${schoolId}', '${academicSessionId}', '${structId}', '${studentId}'
        );
      `);

      // Generate invoice number
      const invoiceNumber = `INV-2026-00${String(invoiceCount).padStart(3, '0')}`;

      // Create ledger debit entry (TUITION GENERATED)
      const debitLedger = await dataSource.query(`
        INSERT INTO "e_schooling"."student_fee_ledgers" (
          "school_id", "academic_session_id", "student_id", "fee_structure_id", 
          "invoice_number", "transaction_type", "entry_type", "amount", "description"
        ) VALUES (
          '${schoolId}', '${academicSessionId}', '${studentId}', '${structId}', 
          '${invoiceNumber}', 'DEBIT', 'TUITION_GENERATED', 60000.00, 'Class 10 Annual Fee assigned'
        ) RETURNING id;
      `);
      const ledgerDebitId = debitLedger[0].id;

      // Seed student payments for some of them
      if (invoiceCount === 1) {
        // Rahul/Student 1: Paid 30000, Concession 5000. Outstanding 25000
        const concession = await dataSource.query(`
          INSERT INTO "e_schooling"."concessions" (
            "school_id", "academic_session_id", "student_id", "invoice_id", 
            "reason", "amount", "approved_by"
          ) VALUES (
            '${schoolId}', '${academicSessionId}', '${studentId}', '${ledgerDebitId}', 
            'Sibling concession', 5000.00, 'Principal'
          ) RETURNING id;
        `);

        await dataSource.query(`
          INSERT INTO "e_schooling"."student_fee_ledgers" (
            "school_id", "academic_session_id", "student_id", "fee_structure_id", 
            "invoice_number", "transaction_type", "entry_type", "amount", "description", "reference_id"
          ) VALUES (
            '${schoolId}', '${academicSessionId}', '${studentId}', '${structId}', 
            '${invoiceNumber}', 'CREDIT', 'CONCESSION', 5000.00, 'Concession applied', '${concession[0].id}'
          );
        `);

        // Add payment
        const payment = await dataSource.query(`
          INSERT INTO "e_schooling"."fee_payments" (
            "school_id", "academic_session_id", "student_id", "invoice_id", 
            "amount", "payment_method", "transaction_reference", "status"
          ) VALUES (
            '${schoolId}', '${academicSessionId}', '${studentId}', '${ledgerDebitId}', 
            30000.00, 'UPI', 'TXN-UPI-9921', 'PAID'
          ) RETURNING id;
        `);

        const receipt = await dataSource.query(`
          INSERT INTO "e_schooling"."fee_receipts" (
            "school_id", "academic_session_id", "fee_payment_id", 
            "receipt_number", "download_url"
          ) VALUES (
            '${schoolId}', '${academicSessionId}', '${payment[0].id}', 
            'RCPT-2026-00001', '/receipts/RCPT-2026-00001.pdf'
          ) RETURNING id;
        `);

        await dataSource.query(`
          UPDATE "e_schooling"."fee_payments" SET "receipt_id" = '${receipt[0].id}' WHERE id = '${payment[0].id}';
        `);

        await dataSource.query(`
          INSERT INTO "e_schooling"."student_fee_ledgers" (
            "school_id", "academic_session_id", "student_id", "fee_structure_id", 
            "invoice_number", "transaction_type", "entry_type", "amount", "description", "reference_id"
          ) VALUES (
            '${schoolId}', '${academicSessionId}', '${studentId}', '${structId}', 
            '${invoiceNumber}', 'CREDIT', 'PAYMENT', 30000.00, 'Payment received via UPI', '${payment[0].id}'
          );
        `);

      } else if (invoiceCount === 2) {
        // Simran/Student 2: Scholarship 10000. Outstanding 50000
        const scholarship = await dataSource.query(`
          INSERT INTO "e_schooling"."scholarships" (
            "school_id", "academic_session_id", "student_id", 
            "title", "amount", "approved_by"
          ) VALUES (
            '${schoolId}', '${academicSessionId}', '${studentId}', 
            'Merit scholarship', 10000.00, 'Principal'
          ) RETURNING id;
        `);

        await dataSource.query(`
          INSERT INTO "e_schooling"."student_fee_ledgers" (
            "school_id", "academic_session_id", "student_id", "fee_structure_id", 
            "invoice_number", "transaction_type", "entry_type", "amount", "description", "reference_id"
          ) VALUES (
            '${schoolId}', '${academicSessionId}', '${studentId}', '${structId}', 
            '${invoiceNumber}', 'CREDIT', 'SCHOLARSHIP', 10000.00, 'Merit scholarship applied', '${scholarship[0].id}'
          );
        `);
      }
    }

    console.log('🎉 Fees Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Exception occurred during fees seeding:', (error as Error).message);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔒 Database connection closed.');
    }
  }
}

runSeed();
