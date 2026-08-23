import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: 'AP' },
  { name: 'Arunachal Pradesh', code: 'AR' },
  { name: 'Assam', code: 'AS' },
  { name: 'Bihar', code: 'BR' },
  { name: 'Chhattisgarh', code: 'CG' },
  { name: 'Goa', code: 'GA' },
  { name: 'Gujarat', code: 'GJ' },
  { name: 'Haryana', code: 'HR' },
  { name: 'Himachal Pradesh', code: 'HP' },
  { name: 'Jharkhand', code: 'JH' },
  { name: 'Karnataka', code: 'KA' },
  { name: 'Kerala', code: 'KL' },
  { name: 'Madhya Pradesh', code: 'MP' },
  { name: 'Maharashtra', code: 'MH' },
  { name: 'Manipur', code: 'MN' },
  { name: 'Meghalaya', code: 'ML' },
  { name: 'Mizoram', code: 'MZ' },
  { name: 'Nagaland', code: 'NL' },
  { name: 'Odisha', code: 'OR' },
  { name: 'Punjab', code: 'PB' },
  { name: 'Rajasthan', code: 'RJ' },
  { name: 'Sikkim', code: 'SK' },
  { name: 'Tamil Nadu', code: 'TN' },
  { name: 'Telangana', code: 'TG' },
  { name: 'Tripura', code: 'TR' },
  { name: 'Uttar Pradesh', code: 'UP' },
  { name: 'Uttarakhand', code: 'UK' },
  { name: 'West Bengal', code: 'WB' },
  { name: 'Andaman and Nicobar Islands', code: 'AN' },
  { name: 'Chandigarh', code: 'CH' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH' },
  { name: 'Delhi', code: 'DL' },
  { name: 'Jammu and Kashmir', code: 'JK' },
  { name: 'Ladakh', code: 'LA' },
  { name: 'Lakshadweep', code: 'LD' },
  { name: 'Puducherry', code: 'PY' },
];

export async function seedStates(dataSource: DataSource) {
  console.log('[SEED STATES] Seeding states using AppDataSource...');
  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "e_schooling";`);
  await dataSource.query(
    `CREATE SEQUENCE IF NOT EXISTS "e_schooling"."states_id_seq";`,
  );
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS "e_schooling"."states" (
      "id"         BIGINT NOT NULL DEFAULT nextval('"e_schooling"."states_id_seq"'),
      "name"       VARCHAR(255) NOT NULL,
      "code"       VARCHAR(10) NOT NULL,
      "is_active"  BOOLEAN NOT NULL DEFAULT true,
      "is_delete"  BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PK_states_id" PRIMARY KEY ("id")
    );
  `);

  await dataSource.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_states_name" ON "e_schooling"."states" ("name");`,
  );
  await dataSource.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_states_code" ON "e_schooling"."states" ("code");`,
  );

  let seededCount = 0;
  for (const state of INDIAN_STATES) {
    const res = await dataSource.query(
      `
      INSERT INTO "e_schooling"."states" ("name", "code", "is_active", "is_delete")
      VALUES ($1, $2, true, false)
      ON CONFLICT ("name") DO UPDATE SET "code" = EXCLUDED."code", "is_active" = true, "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id", "name", "code";
      `,
      [state.name, state.code],
    );
    if (res.length > 0) {
      seededCount++;
    }
  }

  console.log(
    `🎉 [SEED STATES SUCCESS] Successfully seeded ${seededCount} states/UTs.`,
  );
}

async function runSeed() {
  console.log('🚀 Initializing AppDataSource for States Seeding...');
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  try {
    await seedStates(dataSource);
  } catch (err) {
    console.error('❌ [SEED STATES ERROR]', err);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  runSeed();
}
