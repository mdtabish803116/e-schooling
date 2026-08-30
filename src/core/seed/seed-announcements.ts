import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

export async function seedAnnouncementsData(dataSource: DataSource) {
  console.log('📢 Seeding Announcements Data...');
  try {
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."school_announcements" (
        "id" BIGSERIAL NOT NULL,
        "school_id" bigint NOT NULL,
        "academic_session_id" bigint,
        "title" character varying NOT NULL,
        "summary" text,
        "content" text NOT NULL,
        "category" character varying NOT NULL DEFAULT 'GENERAL',
        "priority" character varying NOT NULL DEFAULT 'NORMAL',
        "status" character varying NOT NULL DEFAULT 'PUBLISHED',
        "require_acknowledgement" boolean NOT NULL DEFAULT false,
        "delivery_channels" jsonb DEFAULT '["IN_APP"]',
        "publish_at" TIMESTAMP,
        "published_at" TIMESTAMP,
        "expires_at" TIMESTAMP,
        "targets" jsonb DEFAULT '[]',
        "attachments" jsonb DEFAULT '[]',
        "recipient_summary" jsonb DEFAULT '{}',
        "analytics" jsonb DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_by_id" bigint,
        "created_by_name" character varying,
        "created_by_role" character varying,
        "updated_by_id" bigint,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_school_announcements_id" PRIMARY KEY ("id")
      );
    `);

    // Insert initial seed announcements if none exist
    const countRes = await dataSource.query(
      `SELECT COUNT(*)::int as count FROM "e_schooling"."school_announcements" WHERE "is_delete" = false;`,
    );
    const count = countRes?.[0]?.count || 0;

    if (count === 0) {
      await dataSource.query(`
        INSERT INTO "e_schooling"."school_announcements" (
          "school_id", "academic_session_id", "title", "summary", "content", "category", "priority", "status", "require_acknowledgement", "delivery_channels", "publish_at", "published_at", "expires_at", "targets", "attachments", "recipient_summary", "analytics", "created_by_name", "created_by_role"
        ) VALUES 
        (
          7, 8, 'Annual Sports Day 2026 Celebration',
          'Annual Sports Day will be held on August 30th at the main sports ground. All students and parents are cordially invited.',
          '<p>Dear Parents & Students,</p><p>We are delighted to announce that our <strong>Annual Sports Day 2026</strong> is scheduled for <strong>Saturday, 30th August 2026</strong> starting from 8:30 AM at the School Athletics Ground.</p>',
          'EVENT', 'HIGH', 'PUBLISHED', true, '["IN_APP", "PUSH", "EMAIL"]'::jsonb,
          NOW(), NOW(), NOW() + INTERVAL '10 days',
          '[{"id": "tgt-1", "targetType": "EVERYONE", "targetName": "All School Members"}]'::jsonb,
          '[]'::jsonb,
          '{"staffCount": 45, "studentCount": 850, "parentCount": 780, "totalCount": 1675}'::jsonb,
          '{"totalRecipients": 1675, "deliveredCount": 1650, "viewedCount": 1120, "acknowledgedCount": 840, "unreadCount": 530, "pendingAcknowledgementCount": 835, "acknowledgementRate": 50.1, "viewRate": 66.8}'::jsonb,
          'Principal Dr. Rajesh Sharma', 'School Admin'
        ),
        (
          7, 8, 'Mid-Term Examination Datesheet Released',
          'Mid-Term Examinations for Grade 8 to 12 begin September 10th. Detailed syllabus and timetable available for download.',
          '<p>Dear Students & Parents,</p><p>The datesheet for the Mid-Term Examinations has been published for Grades 8 through 12.</p>',
          'EXAMINATION', 'HIGH', 'PUBLISHED', true, '["IN_APP", "EMAIL"]'::jsonb,
          NOW(), NOW(), NOW() + INTERVAL '15 days',
          '[{"id": "tgt-2", "targetType": "STUDENTS", "targetName": "Students (Grades 8-12)"}]'::jsonb,
          '[]'::jsonb,
          '{"staffCount": 0, "studentCount": 380, "parentCount": 360, "totalCount": 740}'::jsonb,
          '{"totalRecipients": 740, "deliveredCount": 720, "viewedCount": 400, "acknowledgedCount": 250, "unreadCount": 340, "pendingAcknowledgementCount": 490, "acknowledgementRate": 33.8, "viewRate": 54.0}'::jsonb,
          'Examination Cell', 'School Admin'
        );
      `);
      console.log('✅ Seeded initial announcements for School 7!');
    } else {
      console.log(`ℹ️ Announcements table already has ${count} records. Skipping seed insert.`);
    }
  } catch (e) {
    console.error('❌ Failed to seed announcements data:', (e as Error).message);
  }
}

async function runStandaloneSeed() {
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await seedAnnouncementsData(dataSource);
  await dataSource.destroy();
}

if (require.main === module) {
  runStandaloneSeed();
}
