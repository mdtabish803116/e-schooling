import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';

async function run() {
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  console.log('Connected to DB. Checking and creating e_schooling.transport_settings table...');

  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "e_schooling";`);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS "e_schooling"."transport_settings" (
      "id" BIGSERIAL PRIMARY KEY,
      "school_id" bigint NOT NULL UNIQUE,
      "auto_assign_seat_on_allocation" boolean NOT NULL DEFAULT true,
      "max_over_capacity_percent" integer NOT NULL DEFAULT 0,
      "require_driver_license_verification" boolean NOT NULL DEFAULT true,
      "mandatory_pre_trip_inspection" boolean NOT NULL DEFAULT true,
      "speed_limit_kmvh" integer NOT NULL DEFAULT 50,
      "gps_tracking_enabled" boolean NOT NULL DEFAULT true,
      "gps_provider" varchar(150) NOT NULL DEFAULT 'FleetX Live GPS Telematics',
      "gps_api_key" varchar(255),
      "emergency_contact_phone" varchar(50) NOT NULL DEFAULT '+91 98765 43210',
      "notify_on_trip_start" boolean NOT NULL DEFAULT true,
      "notify_on_approach" boolean NOT NULL DEFAULT true,
      "proximity_radius_km" float NOT NULL DEFAULT 1.5,
      "notify_on_boarding" boolean NOT NULL DEFAULT true,
      "default_fee_pricing_model" varchar(50) NOT NULL DEFAULT 'STOP_BASED',
      "billing_cycle" varchar(50) NOT NULL DEFAULT 'MONTHLY',
      "late_fee_percentage" integer NOT NULL DEFAULT 5,
      "allow_vacation_discount" boolean NOT NULL DEFAULT true,
      "license_expiry_alert_days" integer NOT NULL DEFAULT 30,
      "fitness_expiry_alert_days" integer NOT NULL DEFAULT 30,
      "insurance_expiry_alert_days" integer NOT NULL DEFAULT 30,
      "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const result = await dataSource.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'e_schooling' AND table_name = 'transport_settings';
  `);

  console.log('Query result for transport_settings table:', result);

  await dataSource.destroy();
}

run().catch((err) => {
  console.error('Error in script:', err);
  process.exit(1);
});
