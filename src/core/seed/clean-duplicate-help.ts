import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

export async function cleanDuplicateHelpModule(dataSource: DataSource) {
  console.log('🧹 Cleaning duplicate Help module from module_masters...');
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // 1. Delete permissions for 'HELP' alias if 'HELP_GUIDE' exists
    await queryRunner.query(`
      DELETE FROM "e_schooling"."module_operation_permissions"
      WHERE "module_id" IN (
        SELECT "id" FROM "e_schooling"."module_masters" WHERE "code" = 'HELP'
      );
    `);

    // 2. Delete duplicate 'HELP' row from module_masters
    await queryRunner.query(`
      DELETE FROM "e_schooling"."module_masters" WHERE "code" = 'HELP';
    `);

    // 3. Ensure single 'HELP_GUIDE' is clean and active
    await queryRunner.query(`
      UPDATE "e_schooling"."module_masters"
      SET "name" = 'Help & Guide',
          "route_path" = '/help',
          "icon" = 'book',
          "display_order" = 99,
          "show_in_sidebar" = true,
          "is_visible" = true,
          "is_active" = true,
          "is_delete" = false
      WHERE "code" = 'HELP_GUIDE';
    `);

    console.log('✅ Cleaned up duplicate Help & Guide module. Kept single HELP_GUIDE.');
  } catch (error) {
    console.error('⚠️ Error cleaning duplicate:', (error as Error).message);
  } finally {
    await queryRunner.release();
  }
}

async function run() {
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await cleanDuplicateHelpModule(dataSource);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  run();
}
