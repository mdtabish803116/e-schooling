import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimetableEntities1784832101931 implements MigrationInterface {
  name = 'AddTimetableEntities1784832101931';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."academic_timetable_periods" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "name" character varying NOT NULL, "start_time" character varying NOT NULL, "end_time" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'Teaching', "display_order" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b902d94afae7c9e0df66ef02663" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."name" IS 'Period name (e.g. Period 1)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."start_time" IS 'Start time (e.g. 08:30 AM)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."end_time" IS 'End time (e.g. 09:20 AM)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."type" IS 'Type (Teaching, Break, Assembly)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."display_order" IS 'Sorting display order'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."academic_timetable_periods"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0992942b312c079834a38c7200" ON "e_schooling"."academic_timetable_periods" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d9655ab8f70df0ff54a9c946d6" ON "e_schooling"."academic_timetable_periods" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d1171f2e8722b18d87f4606626" ON "e_schooling"."academic_timetable_periods" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."academic_timetable_slots" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "timetable_id" bigint NOT NULL, "day" character varying NOT NULL, "period_id" bigint NOT NULL, "class_id" bigint NOT NULL, "section_id" bigint NOT NULL, "subject_id" bigint NOT NULL, "teacher_id" bigint NOT NULL, "room_no" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7dc369e6bf45c0a78080554a539" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."timetable_id" IS 'Reference to Timetable'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."day" IS 'Day of week (Monday, Tuesday, etc.)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."period_id" IS 'Reference to TimetablePeriod'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."class_id" IS 'Reference to Class'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."section_id" IS 'Reference to Section'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."subject_id" IS 'Reference to Subject'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."teacher_id" IS 'Reference to SchoolUser (Teacher)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."room_no" IS 'Classroom / Room number'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."academic_timetable_slots"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_66fdd7d0f31a76e92a199e1bfd" ON "e_schooling"."academic_timetable_slots" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_366a45c0175ac0ec25987db788" ON "e_schooling"."academic_timetable_slots" ("timetable_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_2dd9dca43caf50bcda82dec221" ON "e_schooling"."academic_timetable_slots" ("period_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_60b83ce766786d71c4d1f4540d" ON "e_schooling"."academic_timetable_slots" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d87403bb3dd35672aa5683387b" ON "e_schooling"."academic_timetable_slots" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_00e24ef2e229825adc3a8018be" ON "e_schooling"."academic_timetable_slots" ("subject_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_816185d2daae4da7b15d65b73e" ON "e_schooling"."academic_timetable_slots" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ac68ea8917d1f1eb714bc30a65" ON "e_schooling"."academic_timetable_slots" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_a133212db69d3dd8e4c73c8c1f" ON "e_schooling"."academic_timetable_slots" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."academic_timetables" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "name" character varying NOT NULL, "academic_year_id" character varying, "status" character varying NOT NULL DEFAULT 'Draft', "version" numeric(5,2) NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bae9c1497014bd14e1b4608b475" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."academic_timetables"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."name" IS 'Timetable title'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."academic_year_id" IS 'Academic year/session reference'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."status" IS 'Status (Draft, Published, Archived)'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."version" IS 'Version number'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."academic_timetables"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_131fdbb6f14be1d0821320cca6" ON "e_schooling"."academic_timetables" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_25d794dcb7600d1632334b0f62" ON "e_schooling"."academic_timetables" ("academic_year_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_17c82b65568532f61cb391331e" ON "e_schooling"."academic_timetables" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ac9645b7bf92a53a42ef4b3b71" ON "e_schooling"."academic_timetables" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."academic_timetable_substitutions" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "slot_id" bigint NOT NULL, "original_teacher_id" bigint NOT NULL, "substitute_teacher_id" bigint NOT NULL, "date" date NOT NULL, "period_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_851479e625cd5b86c740d4fa433" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."slot_id" IS 'Reference to TimetableSlot'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."original_teacher_id" IS 'Original assigned teacher'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."substitute_teacher_id" IS 'Substitute assigned teacher'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."date" IS 'Date of substitution'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."period_id" IS 'Reference to Period'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."academic_timetable_substitutions"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_538cca61b82f64a0bca284765e" ON "e_schooling"."academic_timetable_substitutions" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_951ebc3d488ae3b529f21bbc88" ON "e_schooling"."academic_timetable_substitutions" ("slot_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_c59c507191e4969ff3acfb8470" ON "e_schooling"."academic_timetable_substitutions" ("original_teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bc40efbf702acc0bfc252b612c" ON "e_schooling"."academic_timetable_substitutions" ("substitute_teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_09ef40963fdc5ecf1c25e0d825" ON "e_schooling"."academic_timetable_substitutions" ("period_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_45ff3dc68d00ceb324038ecf1f" ON "e_schooling"."academic_timetable_substitutions" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_9d2d2034b0d133ad5be01f817a" ON "e_schooling"."academic_timetable_substitutions" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."academic_timetable_events" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "title" character varying NOT NULL, "description" text, "date" date NOT NULL, "start_time" character varying, "end_time" character varying, "type" character varying NOT NULL DEFAULT 'event', "location" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_932e48042c7556ac1e04c317743" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."title" IS 'Event title'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."description" IS 'Event description'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."date" IS 'Event date (YYYY-MM-DD)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."start_time" IS 'Start time'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."end_time" IS 'End time'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."type" IS 'Type (class, exam, event, holiday)'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."location" IS 'Event location/venue'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."academic_timetable_events"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_0ddf7771bd8bcb6d5154dc5c27" ON "e_schooling"."academic_timetable_events" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_3448f6556be24246cac138eb51" ON "e_schooling"."academic_timetable_events" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feff11d8cf5afef113a8a34dc9" ON "e_schooling"."academic_timetable_events" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."attendance_locks" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "date" date NOT NULL, "is_locked" boolean NOT NULL DEFAULT true, "locked_by" character varying, "created_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_032df18264e0a7b02a42ab093e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d6479b5439e1524c0e66e558bf" ON "e_schooling"."attendance_locks" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_5535dc6ee41f60d9b3449775d0" ON "e_schooling"."attendance_locks" ("date") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "e_schooling"."holidays" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "title" character varying NOT NULL, "description" text, "from_date" date NOT NULL, "to_date" date NOT NULL, "academic_session_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."holidays"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."holidays"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."holidays"."title" IS 'Holiday title'; COMMENT ON COLUMN "e_schooling"."holidays"."description" IS 'Description or remarks'; COMMENT ON COLUMN "e_schooling"."holidays"."from_date" IS 'Start date of holiday'; COMMENT ON COLUMN "e_schooling"."holidays"."to_date" IS 'End date of holiday'; COMMENT ON COLUMN "e_schooling"."holidays"."academic_session_id" IS 'Academic session ID'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_656466c53133f84535ede6fafb" ON "e_schooling"."holidays" ("school_id") `,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token" IS 'Token/OTP used for password reset verification'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token_expires" IS 'Expiration timestamp for password reset token'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."blood_group" IS 'Blood group e.g. A+, O-'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."religion" IS 'Religion'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."category" IS 'Caste category e.g. General, OBC, SC, ST'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."nationality" IS 'Nationality'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."aadhaar_number" IS '12-digit Aadhaar number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."phone" IS 'Primary phone number (legacy field)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mobile" IS 'Mobile / WhatsApp number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."alternate_mobile" IS 'Alternate contact number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."address" IS 'Full residential address'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."village" IS 'Village / Locality'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."district" IS 'District name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."state" IS 'State name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."pincode" IS 'Postal / ZIP code'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_name" IS 'Generic parent name (legacy)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_phone" IS 'Generic parent phone (legacy)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_name" IS 'Father''s full name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_occupation" IS 'Father''s occupation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_mobile" IS 'Father''s mobile number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_email" IS 'Father''s email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_aadhaar" IS 'Father''s Aadhaar number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_name" IS 'Mother''s full name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_occupation" IS 'Mother''s occupation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_mobile" IS 'Mother''s mobile number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_email" IS 'Mother''s email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_aadhaar" IS 'Mother''s Aadhaar number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_name" IS 'Legal guardian''s name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_relation" IS 'Guardian''s relationship to student'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_mobile" IS 'Guardian''s mobile number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_email" IS 'Guardian''s email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_name" IS 'Emergency contact person name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_phone" IS 'Emergency contact phone number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_relation" IS 'Relation of emergency contact to student'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."medical_condition" IS 'Known medical conditions'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."allergies" IS 'Known allergies'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."disability" IS 'Physical/learning disability if any'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_name" IS 'Family doctor name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_phone" IS 'Family doctor contact number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_date" IS 'Date of admission'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."joining_date" IS 'Date of first joining'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_type" IS 'NEW or TRANSFER'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."previous_school" IS 'Previous school details as JSON'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."documents" IS 'Uploaded student verification documents'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."first_name" IS 'First name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."last_name" IS 'Last name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."email" IS 'Primary contact email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."designation" IS 'Job designation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."joining_date" IS 'Date of joining the school'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."department_name" IS 'Department name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."qualifications" IS 'Academic qualifications history'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."experience" IS 'Professional experience history'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."documents" IS 'Uploaded staff verification documents'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_classes" IS 'Assigned classes list'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_subjects" IS 'Assigned subjects list'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."timetable_assignments" IS 'Timetable slots and period allocations'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."gender" IS 'Male | Female | Other'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."emergency_contact" IS 'Emergency contact number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."address" IS 'Residential address'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."employment_status" IS 'Full-time | Part-time | Contract'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."salary_type" IS 'Monthly | Hourly'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."base_salary" IS 'Base salary amount'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."allowances" IS 'Additional allowances'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."bank_name" IS 'Bank name for payroll'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."account_number" IS 'Bank account number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."ifsc_code" IS 'Bank IFSC code'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."pan_number" IS 'PAN card number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token" IS 'Token/OTP used for password reset verification'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token_expires" IS 'Expiration timestamp for password reset token'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token" IS 'Token/OTP used for password reset verification'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token_expires" IS 'Expiration timestamp for password reset token'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."blood_group" IS 'Blood group e.g. A+, O-'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."religion" IS 'Religion'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."category" IS 'Caste category e.g. General, OBC, SC, ST'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."nationality" IS 'Nationality'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."aadhaar_number" IS '12-digit Aadhaar number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."phone" IS 'Primary phone number (legacy field)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mobile" IS 'Mobile / WhatsApp number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."alternate_mobile" IS 'Alternate contact number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."address" IS 'Full residential address'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."village" IS 'Village / Locality'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."district" IS 'District name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."state" IS 'State name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."pincode" IS 'Postal / ZIP code'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_name" IS 'Generic parent name (legacy)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_phone" IS 'Generic parent phone (legacy)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_name" IS 'Father''s full name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_occupation" IS 'Father''s occupation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_mobile" IS 'Father''s mobile number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_email" IS 'Father''s email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_aadhaar" IS 'Father''s Aadhaar number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_name" IS 'Mother''s full name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_occupation" IS 'Mother''s occupation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_mobile" IS 'Mother''s mobile number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_email" IS 'Mother''s email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_aadhaar" IS 'Mother''s Aadhaar number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_name" IS 'Legal guardian''s name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_relation" IS 'Guardian''s relationship to student'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_mobile" IS 'Guardian''s mobile number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_email" IS 'Guardian''s email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_name" IS 'Emergency contact person name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_phone" IS 'Emergency contact phone number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_relation" IS 'Relation of emergency contact to student'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."medical_condition" IS 'Known medical conditions'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."allergies" IS 'Known allergies'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."disability" IS 'Physical/learning disability if any'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_name" IS 'Family doctor name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_phone" IS 'Family doctor contact number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_date" IS 'Date of admission'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."joining_date" IS 'Date of first joining'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_type" IS 'NEW or TRANSFER'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."previous_school" IS 'Previous school details as JSON'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."documents" IS 'Uploaded student verification documents'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."first_name" IS 'First name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."last_name" IS 'Last name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."email" IS 'Primary contact email'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."designation" IS 'Job designation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."joining_date" IS 'Date of joining the school'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."department_name" IS 'Department name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."qualifications" IS 'Academic qualifications history'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."experience" IS 'Professional experience history'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."documents" IS 'Uploaded staff verification documents'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_classes" IS 'Assigned classes list'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_subjects" IS 'Assigned subjects list'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."timetable_assignments" IS 'Timetable slots and period allocations'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."gender" IS 'Male | Female | Other'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."emergency_contact" IS 'Emergency contact number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."address" IS 'Residential address'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."employment_status" IS 'Full-time | Part-time | Contract'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."salary_type" IS 'Monthly | Hourly'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."base_salary" IS 'Base salary amount'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."allowances" IS 'Additional allowances'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."bank_name" IS 'Bank name for payroll'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."account_number" IS 'Bank account number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."ifsc_code" IS 'Bank IFSC code'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."pan_number" IS 'PAN card number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token" IS 'Token/OTP used for password reset verification'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token_expires" IS 'Expiration timestamp for password reset token'`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" ADD CONSTRAINT "FK_366a45c0175ac0ec25987db7886" FOREIGN KEY ("timetable_id") REFERENCES "e_schooling"."academic_timetables"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" ADD CONSTRAINT "FK_2dd9dca43caf50bcda82dec2212" FOREIGN KEY ("period_id") REFERENCES "e_schooling"."academic_timetable_periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" ADD CONSTRAINT "FK_60b83ce766786d71c4d1f4540d3" FOREIGN KEY ("class_id") REFERENCES "e_schooling"."classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" ADD CONSTRAINT "FK_d87403bb3dd35672aa5683387b8" FOREIGN KEY ("section_id") REFERENCES "e_schooling"."sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" ADD CONSTRAINT "FK_00e24ef2e229825adc3a8018bed" FOREIGN KEY ("subject_id") REFERENCES "e_schooling"."subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" ADD CONSTRAINT "FK_816185d2daae4da7b15d65b73e5" FOREIGN KEY ("teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_substitutions" ADD CONSTRAINT "FK_951ebc3d488ae3b529f21bbc88b" FOREIGN KEY ("slot_id") REFERENCES "e_schooling"."academic_timetable_slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_substitutions" ADD CONSTRAINT "FK_c59c507191e4969ff3acfb84709" FOREIGN KEY ("original_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_substitutions" ADD CONSTRAINT "FK_bc40efbf702acc0bfc252b612cc" FOREIGN KEY ("substitute_teacher_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_substitutions" DROP CONSTRAINT "FK_bc40efbf702acc0bfc252b612cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_substitutions" DROP CONSTRAINT "FK_c59c507191e4969ff3acfb84709"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_substitutions" DROP CONSTRAINT "FK_951ebc3d488ae3b529f21bbc88b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" DROP CONSTRAINT "FK_816185d2daae4da7b15d65b73e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" DROP CONSTRAINT "FK_00e24ef2e229825adc3a8018bed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" DROP CONSTRAINT "FK_d87403bb3dd35672aa5683387b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" DROP CONSTRAINT "FK_60b83ce766786d71c4d1f4540d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" DROP CONSTRAINT "FK_2dd9dca43caf50bcda82dec2212"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."academic_timetable_slots" DROP CONSTRAINT "FK_366a45c0175ac0ec25987db7886"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token_expires" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."pan_number" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."ifsc_code" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."account_number" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."bank_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."allowances" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."base_salary" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."salary_type" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."employment_status" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."address" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."emergency_contact" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."gender" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."timetable_assignments" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_subjects" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_classes" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."documents" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."experience" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."qualifications" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."department_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."joining_date" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."designation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."last_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."first_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."documents" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."previous_school" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_type" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."joining_date" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_date" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_phone" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."disability" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."allergies" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."medical_condition" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_relation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_phone" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_relation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_aadhaar" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_occupation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_aadhaar" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_occupation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_phone" IS 'Parent phone'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_name" IS 'Parent name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."pincode" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."state" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."district" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."village" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."address" IS 'Physical address'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."alternate_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."phone" IS 'Phone number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."aadhaar_number" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."nationality" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."category" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."religion" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."blood_group" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token_expires" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token_expires" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_owners"."reset_token" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."pan_number" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."ifsc_code" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."account_number" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."bank_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."allowances" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."base_salary" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."salary_type" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."employment_status" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."address" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."emergency_contact" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."gender" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."timetable_assignments" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_subjects" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."assigned_classes" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."documents" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."experience" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."qualifications" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."department_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."joining_date" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."designation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."last_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_user_profiles"."first_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."documents" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."previous_school" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_type" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."joining_date" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."admission_date" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_phone" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."doctor_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."disability" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."allergies" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."medical_condition" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_relation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_phone" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."emergency_contact_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_relation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."guardian_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_aadhaar" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_occupation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mother_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_aadhaar" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_email" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_occupation" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."father_name" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_phone" IS 'Parent phone'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."parent_name" IS 'Parent name'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."pincode" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."state" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."district" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."village" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."address" IS 'Physical address'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."alternate_mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."mobile" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."phone" IS 'Phone number'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."aadhaar_number" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."nationality" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."category" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."religion" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."students"."blood_group" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token_expires" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "e_schooling"."school_users"."reset_token" IS NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_656466c53133f84535ede6fafb"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."holidays"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_5535dc6ee41f60d9b3449775d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_d6479b5439e1524c0e66e558bf"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."attendance_locks"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_feff11d8cf5afef113a8a34dc9"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_3448f6556be24246cac138eb51"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0ddf7771bd8bcb6d5154dc5c27"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."academic_timetable_events"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_9d2d2034b0d133ad5be01f817a"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_45ff3dc68d00ceb324038ecf1f"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_09ef40963fdc5ecf1c25e0d825"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_bc40efbf702acc0bfc252b612c"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_c59c507191e4969ff3acfb8470"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_951ebc3d488ae3b529f21bbc88"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_538cca61b82f64a0bca284765e"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."academic_timetable_substitutions"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ac9645b7bf92a53a42ef4b3b71"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_17c82b65568532f61cb391331e"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_25d794dcb7600d1632334b0f62"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_131fdbb6f14be1d0821320cca6"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."academic_timetables"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_a133212db69d3dd8e4c73c8c1f"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ac68ea8917d1f1eb714bc30a65"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_816185d2daae4da7b15d65b73e"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_00e24ef2e229825adc3a8018be"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_d87403bb3dd35672aa5683387b"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_60b83ce766786d71c4d1f4540d"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_2dd9dca43caf50bcda82dec221"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_366a45c0175ac0ec25987db788"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_66fdd7d0f31a76e92a199e1bfd"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."academic_timetable_slots"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_d1171f2e8722b18d87f4606626"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_d9655ab8f70df0ff54a9c946d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0992942b312c079834a38c7200"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."academic_timetable_periods"`,
    );
  }
}
