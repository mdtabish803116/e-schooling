import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';
import { AddHelpModuleAndPermissionsSeed1786500000000 } from '../database/postgres/migrations/1786500000000-AddHelpModuleAndPermissionsSeed';

export async function seedHelpModule(dataSource: DataSource) {
  console.log('📚 Seeding Help & Guide Module in module_masters and permissions...');
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const migration = new AddHelpModuleAndPermissionsSeed1786500000000();
    await migration.up(queryRunner);
    console.log('✅ Help & Guide Module seeded successfully into module_masters!');
  } catch (error) {
    console.error('⚠️ Exception seeding Help Module:', (error as Error).message);
  } finally {
    await queryRunner.release();
  }
}

async function runStandalone() {
  console.log('🚀 Connecting to Database...');
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await seedHelpModule(dataSource);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  console.log('🔒 Database connection closed.');
}

if (require.main === module) {
  runStandalone();
}
