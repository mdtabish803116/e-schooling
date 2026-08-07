import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

async function updateSessionIds() {
  console.log('🚀 Initializing Database Connection for Session ID Backfill...');
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  console.log('✅ Database connected successfully!');

  const tables = [
    'classes',
    'sections',
    'class_section_subjects',
    'subjects',
    'teacher_section_assignments',
    'rooms',
    'student_subjects',
  ];

  console.log(
    '🔄 Backfilling academic_session_id = 1 for all existing NULL records...',
  );

  for (const table of tables) {
    const res = await dataSource.query(
      `UPDATE "e_schooling"."${table}" SET "academic_session_id" = 1 WHERE "academic_session_id" IS NULL;`,
    );
    console.log(`✅ Updated table "e_schooling"."${table}"`);
  }

  await dataSource.destroy();
  console.log('🔒 Database connection closed.');
  console.log('🎉 Academic Session ID backfill completed successfully!');
}

updateSessionIds().catch(console.error);
