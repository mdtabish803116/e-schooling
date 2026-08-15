import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PlatformService } from '../../services/platform/platform.service';
import AppDataSource from '../database/postgres/data-source';
import { seedLoginHistoryTable } from './seed-login-history';
import { seedSchoolUserProfiles } from './seed-school-user-profiles';

async function runSeed() {
  console.log('🚀 Initializing Database Connection for Seeding...');
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
    const platformService = new PlatformService(dataSource);
    console.log('🌱 Starting Platform Data Seeding...');
    const result = await platformService.seedPlatformData();

    console.log('🛡️ Running Login History Table & Data Seed...');
    await seedLoginHistoryTable(dataSource);

    console.log('👤 Running School User Profiles Seed...');
    await seedSchoolUserProfiles(dataSource);

    console.log('🎉 Seeding completed successfully!');
    console.log(result);
  } catch (error) {
    console.error(
      '⚠️ Exception occurred during seeding (handled):',
      (error as Error).message,
    );
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔒 Database connection closed.');
    }
  }
}

runSeed();
