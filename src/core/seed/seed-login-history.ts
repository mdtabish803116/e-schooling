import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

export async function seedLoginHistoryTable(dataSource: DataSource) {
  console.log(
    '📦 Creating table "e_schooling"."user_login_history" if not exists...',
  );

  // 1. Table Creation
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS "e_schooling"."user_login_history" (
      "id" BIGSERIAL PRIMARY KEY,
      "school_id" varchar,
      "user_id" varchar,
      "role" varchar(50) NOT NULL DEFAULT 'STAFF',
      "entity_id" varchar,
      "identifier_used" varchar(150) NOT NULL,
      "auth_action" varchar(50) NOT NULL DEFAULT 'LOGIN_SUCCESS',
      "login_method" varchar(50) NOT NULL DEFAULT 'PASSWORD',
      "login_status" varchar(20) NOT NULL DEFAULT 'SUCCESS',
      "failure_reason" varchar(255),
      "login_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "logout_at" TIMESTAMP,
      "session_duration_seconds" integer,
      "session_id" varchar(255),
      "refresh_token_id" varchar(255),
      "session_status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
      "device_type" varchar(50) NOT NULL DEFAULT 'Desktop',
      "device_name" varchar(100) NOT NULL DEFAULT 'Unknown Device',
      "browser" varchar(100) NOT NULL DEFAULT 'Unknown Browser',
      "browser_version" varchar(50),
      "operating_system" varchar(100) NOT NULL DEFAULT 'Unknown OS',
      "user_agent" text,
      "ip_address" varchar(100) NOT NULL DEFAULT '127.0.0.1',
      "location" varchar(150),
      "country" varchar(100),
      "city" varchar(100),
      "mfa_used" boolean NOT NULL DEFAULT false,
      "risk_score" double precision NOT NULL DEFAULT 0,
      "is_suspicious" boolean NOT NULL DEFAULT false,
      "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "is_deleted" boolean NOT NULL DEFAULT false
    );
  `);

  // 2. Indexes Creation
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_user_login_history_school_login_at" 
    ON "e_schooling"."user_login_history" ("school_id", "login_at");
  `);

  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_user_login_history_user_login_at" 
    ON "e_schooling"."user_login_history" ("user_id", "login_at");
  `);

  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_user_login_history_session_id" 
    ON "e_schooling"."user_login_history" ("session_id");
  `);

  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_user_login_history_session_status" 
    ON "e_schooling"."user_login_history" ("session_status");
  `);

  console.log('✅ Table "user_login_history" & indexes verified.');

  // 3. Sample Data Seeding
  const countRes = await dataSource.query<{ count: number }[]>(
    `SELECT COUNT(*)::int as count FROM "e_schooling"."user_login_history"`,
  );
  const count = countRes[0]?.count || 0;

  if (count === 0) {
    console.log('🌱 Seeding initial login history records...');

    await dataSource.query(`
      INSERT INTO "e_schooling"."user_login_history" (
        "school_id", "user_id", "role", "entity_id", "identifier_used", 
        "auth_action", "login_method", "login_status", "failure_reason", 
        "session_id", "session_status", "device_type", "device_name", 
        "browser", "browser_version", "operating_system", "user_agent", 
        "ip_address", "location", "country", "city", "mfa_used"
      ) VALUES 
      (
        '2', 'usr-owner-1', 'OWNER', 'usr-owner-1', 'owner@eschool.com',
        'LOGIN_SUCCESS', 'PASSWORD', 'SUCCESS', NULL,
        'sess-owner-init-01', 'ACTIVE', 'Desktop', 'Windows PC',
        'Google Chrome', '126.0.0', 'Windows 11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
        '103.21.124.88', 'New Delhi, India', 'India', 'New Delhi', true
      ),
      (
        '2', 'usr-staff-12', 'TEACHER', 'stf-440', 'teacher_rahul',
        'LOGIN_SUCCESS', 'PASSWORD', 'SUCCESS', NULL,
        'sess-staff-init-02', 'LOGGED_OUT', 'Mobile', 'iPhone 15 Pro',
        'Apple Safari', '17.4', 'iOS 17', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) Safari/604.1',
        '49.36.18.201', 'Noida, India', 'India', 'Noida', false
      ),
      (
        '2', 'usr-staff-88', 'ACCOUNTANT', 'stf-108', 'finance_dept@eschool.com',
        'LOGIN_FAILED', 'PASSWORD', 'FAILED', 'Wrong Password',
        NULL, 'LOGGED_OUT', 'Desktop', 'MacBook Air',
        'Mozilla Firefox', '125.0', 'macOS Sonoma', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Firefox/125.0',
        '182.73.19.4', 'Gurugram, India', 'India', 'Gurugram', false
      ),
      (
        '2', 'usr-std-505', 'STUDENT', 'std-505', 'SCH-BLUE-2024-001',
        'ACCOUNT_LOCKED', 'PASSWORD', 'FAILED', 'Account temporarily locked after 5 failed attempts',
        NULL, 'LOGGED_OUT', 'Mobile', 'Samsung Galaxy S23',
        'Google Chrome Mobile', '124.0', 'Android 14', 'Mozilla/5.0 (Linux; Android 14; Mobile) Chrome/124.0',
        '157.33.20.91', 'Faridabad, India', 'India', 'Faridabad', false
      );
    `);
    console.log('🎉 Seeded 4 initial user login history records!');
  } else {
    console.log(
      `ℹ️ Login history table already contains ${count} records. Skipping data insertion.`,
    );
  }
}

async function runStandaloneSeed() {
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource) {
    console.error('❌ Failed to create Data Source');
    process.exit(1);
  }

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  try {
    await seedLoginHistoryTable(dataSource);
  } catch (err) {
    console.error('❌ Error seeding login history:', err);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run standalone if invoked directly
if (require.main === module) {
  void runStandaloneSeed();
}
