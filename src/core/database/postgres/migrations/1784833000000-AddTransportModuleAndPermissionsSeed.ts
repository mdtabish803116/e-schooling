import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransportModuleAndPermissionsSeed1784833000000 implements MigrationInterface {
  name = 'AddTransportModuleAndPermissionsSeed1784833000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Ensure schema e_schooling exists
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "e_schooling";`);

    // 1. Create Transport Tables if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."transport_vehicles" (
        "id" BIGSERIAL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "vehicle_number" varchar(50) NOT NULL,
        "registration_number" varchar(50) NOT NULL,
        "model" varchar(100) NOT NULL,
        "capacity" integer NOT NULL DEFAULT 32,
        "occupied_seats" integer NOT NULL DEFAULT 0,
        "driver_id" bigint,
        "driver_name" varchar(100),
        "driver_phone" varchar(25),
        "helper_name" varchar(100),
        "helper_phone" varchar(25),
        "status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
        "insurance_expiry" varchar(30),
        "fitness_expiry" varchar(30),
        "gps_enabled" boolean NOT NULL DEFAULT true,
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "e_schooling"."transport_routes" (
        "id" BIGSERIAL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "route_code" varchar(50) NOT NULL,
        "route_name" varchar(150) NOT NULL,
        "start_location" varchar(150) NOT NULL,
        "end_location" varchar(150) NOT NULL,
        "distance_km" numeric(8,2) NOT NULL DEFAULT 0,
        "assigned_vehicle_id" bigint,
        "assigned_vehicle_number" varchar(50),
        "base_monthly_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "total_allocated_students" integer NOT NULL DEFAULT 0,
        "status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "e_schooling"."transport_pickup_points" (
        "id" BIGSERIAL PRIMARY KEY,
        "route_id" bigint NOT NULL,
        "name" varchar(150) NOT NULL,
        "pickup_time" varchar(50) NOT NULL DEFAULT '07:30 AM',
        "drop_time" varchar(50) NOT NULL DEFAULT '03:30 PM',
        "sequence_order" integer NOT NULL DEFAULT 1,
        "landmark" varchar(200),
        "monthly_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "e_schooling"."transport_drivers" (
        "id" BIGSERIAL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "user_id" varchar(100),
        "role_id" varchar(100),
        "role_name" varchar(100),
        "name" varchar(100) NOT NULL,
        "phone" varchar(25) NOT NULL,
        "license_number" varchar(100) NOT NULL,
        "license_expiry" varchar(30) NOT NULL,
        "address" text,
        "emergency_contact" varchar(25),
        "assigned_vehicle_id" bigint,
        "status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "e_schooling"."transport_allocations" (
        "id" BIGSERIAL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "student_id" varchar(100) NOT NULL,
        "student_name" varchar(150),
        "roll_number" varchar(50),
        "class_name" varchar(50),
        "section_name" varchar(50),
        "route_id" bigint NOT NULL,
        "route_name" varchar(150),
        "pickup_point_id" bigint NOT NULL,
        "pickup_point_name" varchar(150),
        "pickup_time" varchar(50),
        "vehicle_id" bigint,
        "vehicle_number" varchar(50),
        "driver_id" bigint,
        "driver_name" varchar(100),
        "driver_phone" varchar(25),
        "start_date" varchar(30),
        "end_date" varchar(30),
        "monthly_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "e_schooling"."transport_vehicle_assignments" (
        "id" BIGSERIAL PRIMARY KEY,
        "school_id" bigint NOT NULL,
        "vehicle_id" bigint NOT NULL,
        "vehicle_number" varchar(50) NOT NULL,
        "registration_number" varchar(50) NOT NULL,
        "driver_id" bigint NOT NULL,
        "driver_name" varchar(100) NOT NULL,
        "driver_phone" varchar(25) NOT NULL,
        "assigned_date" varchar(30) NOT NULL,
        "released_date" varchar(30),
        "assigned_by" varchar(100),
        "notes" text,
        "status" varchar(30) NOT NULL DEFAULT 'ACTIVE',
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS "e_schooling"."admission_enquiries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "school_id" varchar(100) NOT NULL,
        "enquiry_no" varchar(50) NOT NULL,
        "student_name" varchar(150) NOT NULL,
        "parent_name" varchar(150) NOT NULL,
        "contact_number" varchar(50) NOT NULL,
        "email" varchar(150),
        "target_class_id" varchar(100) NOT NULL,
        "target_class_name" varchar(100),
        "gender" varchar(20) NOT NULL DEFAULT 'MALE',
        "previous_school" varchar(150),
        "source" varchar(50) NOT NULL DEFAULT 'WALK_IN',
        "stage" varchar(50) NOT NULL DEFAULT 'ENQUIRY',
        "enquiry_status" varchar(50) NOT NULL DEFAULT 'NEW',
        "notes" text,
        "assigned_to_staff_name" varchar(150),
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "e_schooling"."admission_applications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "school_id" varchar(100) NOT NULL,
        "application_no" varchar(50) NOT NULL,
        "enquiry_id" varchar(100),
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "gender" varchar(20) NOT NULL DEFAULT 'MALE',
        "dob" varchar(30),
        "father_name" varchar(150) NOT NULL,
        "father_phone" varchar(50) NOT NULL,
        "mother_name" varchar(150),
        "target_class_id" varchar(100) NOT NULL,
        "target_class_name" varchar(100),
        "stage" varchar(50) NOT NULL DEFAULT 'APPLICATION',
        "verification_status" varchar(50) NOT NULL DEFAULT 'PENDING',
        "verified_documents" jsonb,
        "rejection_reason" text,
        "approval_remarks" text,
        "approved_by" varchar(100),
        "converted_student_id" varchar(100),
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE "e_schooling"."transport_drivers" ADD COLUMN IF NOT EXISTS "user_id" varchar(100);
      ALTER TABLE "e_schooling"."transport_drivers" ADD COLUMN IF NOT EXISTS "role_id" varchar(100);
      ALTER TABLE "e_schooling"."transport_drivers" ADD COLUMN IF NOT EXISTS "role_name" varchar(100);
      ALTER TABLE "e_schooling"."transport_drivers" ADD COLUMN IF NOT EXISTS "assigned_vehicle_number" varchar(50);
    `);

    // 2. Sync primary key sequences to avoid collisions
    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('"e_schooling"."module_operation_permissions"', 'id'),
        COALESCE((SELECT MAX(id) FROM "e_schooling"."module_operation_permissions"), 1)
      );
      SELECT setval(
        pg_get_serial_sequence('"e_schooling"."module_masters"', 'id'),
        COALESCE((SELECT MAX(id) FROM "e_schooling"."module_masters"), 1)
      );
    `);

    // 3. Seed Transport Module in module_masters
    await queryRunner.query(`
      INSERT INTO "e_schooling"."module_masters"
        ("name", "code", "route_path", "icon", "display_order", "is_menu_group", "show_in_sidebar", "is_visible", "is_active", "is_delete")
      VALUES
        ('Transport', 'TRANSPORT', '/transport', 'directions_bus', 18, false, true, true, true, false)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "route_path" = EXCLUDED."route_path",
        "icon" = EXCLUDED."icon",
        "display_order" = EXCLUDED."display_order",
        "show_in_sidebar" = EXCLUDED."show_in_sidebar",
        "is_active" = true,
        "is_delete" = false;
    `);

    // 4. Link Transport Module Operations (VIEW, CREATE, UPDATE, DELETE)
    const permPairs = [
      ['TRANSPORT', 'VIEW'],
      ['TRANSPORT', 'CREATE'],
      ['TRANSPORT', 'UPDATE'],
      ['TRANSPORT', 'DELETE'],
    ];

    for (const [modCode, opCode] of permPairs) {
      await queryRunner.query(`
        INSERT INTO "e_schooling"."module_operation_permissions" ("module_id", "operation_id", "description", "is_active", "is_delete")
        SELECT m.id, o.id, 'Grants permission to ' || o.name || ' in ' || m.name, true, false
        FROM "e_schooling"."module_masters" m
        CROSS JOIN "e_schooling"."operation_masters" o
        WHERE m.code = '${modCode}' AND o.code = '${opCode}'
        AND NOT EXISTS (
          SELECT 1 FROM "e_schooling"."module_operation_permissions" mop
          WHERE mop.module_id = m.id AND mop.operation_id = o.id
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "e_schooling"."module_operation_permissions"
      WHERE "module_id" IN (
        SELECT "id" FROM "e_schooling"."module_masters" WHERE "code" = 'TRANSPORT'
      );
    `);
    await queryRunner.query(`
      DELETE FROM "e_schooling"."module_masters" WHERE "code" = 'TRANSPORT';
    `);
  }
}
