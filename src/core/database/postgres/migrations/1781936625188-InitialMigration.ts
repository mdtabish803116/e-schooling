import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1781936625188 implements MigrationInterface {
  name = 'InitialMigration1781936625188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."subscription_plan_prices" ("id" BIGSERIAL NOT NULL, "subscription_plan_id" bigint NOT NULL, "billing_cycle" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_0d799a0794b0d29173f83aa4012" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."subscription_plan_id" IS 'Reference to SubscriptionPlan'; COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."billing_cycle" IS 'monthly | quarterly | yearly'; COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."price" IS 'Price in INR'; COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."updated_at" IS 'Last update timestamp'; COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."subscription_plan_prices"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35dfa5e6546954af557d5f1cd1" ON "e_schooling"."subscription_plan_prices" ("subscription_plan_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_29ad372ecd17d6c8f597dd8793" ON "e_schooling"."subscription_plan_prices" ("subscription_plan_id", "billing_cycle") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."platform_features" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "code" character varying NOT NULL, "description" text, "feature_type" character varying NOT NULL DEFAULT 'ADDON', "usage_unit" character varying NOT NULL DEFAULT 'NONE', "is_metered" boolean NOT NULL DEFAULT false, "default_limit" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1cb1d473652fffb31a9902bf5fc" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."platform_features"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."platform_features"."name" IS 'Display name e.g. WhatsApp Integration'; COMMENT ON COLUMN "e_schooling"."platform_features"."code" IS 'Unique identification code'; COMMENT ON COLUMN "e_schooling"."platform_features"."description" IS 'Capability documentation'; COMMENT ON COLUMN "e_schooling"."platform_features"."feature_type" IS 'CORE | ADDON | ENTERPRISE'; COMMENT ON COLUMN "e_schooling"."platform_features"."usage_unit" IS 'NONE | STUDENTS | MESSAGES | ADMINS | STORAGE_GB | API_CALLS'; COMMENT ON COLUMN "e_schooling"."platform_features"."is_metered" IS 'True if metered consumption applies'; COMMENT ON COLUMN "e_schooling"."platform_features"."default_limit" IS 'Default limit/quota value for this feature or booster'; COMMENT ON COLUMN "e_schooling"."platform_features"."is_active" IS 'Global availability toggle'; COMMENT ON COLUMN "e_schooling"."platform_features"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."platform_features"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."platform_features"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."platform_features"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."platform_features"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5b5228738b49e583eedc2edb47" ON "e_schooling"."platform_features" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7e13da35936d31f29c3f7d30a0" ON "e_schooling"."platform_features" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e5d152d519f6a87d849226f37" ON "e_schooling"."platform_features" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."subscription_plan_platform_feature_mappings" ("id" BIGSERIAL NOT NULL, "subscription_plan_id" bigint NOT NULL, "platform_feature_id" bigint NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "limit_value" bigint, "extra_metadata" jsonb, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7347adcf918e435a9297227a3ab" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."subscription_plan_id" IS 'Reference to SubscriptionPlan'; COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."platform_feature_id" IS 'Reference to PlatformFeature'; COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."is_enabled" IS 'Baseline feature enabled state'; COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."limit_value" IS 'Default quota limit. Null means unlimited'; COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."extra_metadata" IS 'Extensible plan configuration details'; COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."subscription_plan_platform_feature_mappings"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc1b0c538b7cb9aa972c5ba3da" ON "e_schooling"."subscription_plan_platform_feature_mappings" ("subscription_plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97264083451de63d64801751f2" ON "e_schooling"."subscription_plan_platform_feature_mappings" ("platform_feature_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."subscription_plans" ("id" BIGSERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "max_students" integer, "max_staff" integer, "max_classes" integer, "max_sections" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."subscription_plans"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."code" IS 'Unique plan code e.g. TRIAL, BASIC, STANDARD, PREMIUM'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."name" IS 'Display name e.g. Basic Plan'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."description" IS 'Plan description'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."max_students" IS 'Maximum allowed students. Null means unlimited.'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."max_staff" IS 'Maximum allowed school staff/users. Null means unlimited.'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."max_classes" IS 'Maximum allowed classes. Null means unlimited.'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."max_sections" IS 'Maximum allowed sections. Null means unlimited.'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."updated_at" IS 'Last update timestamp'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."subscription_plans"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2d2df70a81d37c893ef216caf8" ON "e_schooling"."subscription_plans" ("code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_subscriptions" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "subscription_plan_id" bigint NOT NULL, "subscription_state" character varying NOT NULL DEFAULT 'trial', "billing_cycle" character varying, "trial_start_at" TIMESTAMP, "trial_end_at" TIMESTAMP, "current_period_start" TIMESTAMP, "current_period_end" TIMESTAMP, "queued_subscription_plan_id" bigint, "queued_billing_cycle" character varying, "queued_start_date" TIMESTAMP, "queued_end_date" TIMESTAMP, "activation_strategy" character varying DEFAULT 'queue', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_daa5a51e88856a2628e9ef736db" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_subscriptions"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."subscription_plan_id" IS 'Reference to SubscriptionPlan'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."subscription_state" IS 'trial | active | expired | cancelled | suspended'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."billing_cycle" IS 'Active billing cycle tier'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."trial_start_at" IS 'Trial start timestamp'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."trial_end_at" IS 'Trial expiration timestamp'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."current_period_start" IS 'Current billing period start'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."current_period_end" IS 'Current billing period expiration'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."queued_subscription_plan_id" IS 'Queued SubscriptionPlan ID'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."queued_billing_cycle" IS 'Queued billing cycle tier'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."queued_start_date" IS 'When the queued plan starts'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."queued_end_date" IS 'When the queued plan ends'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."activation_strategy" IS 'queue | immediate | parallel'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."updated_at" IS 'Last update timestamp'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_subscriptions"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_84aee9a3a25ab728a2c2f18023" ON "e_schooling"."school_subscriptions" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6b0d048e330af6d4fd91594ce" ON "e_schooling"."school_subscriptions" ("subscription_plan_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."schools" ("id" BIGSERIAL NOT NULL, "school_name" character varying, "internal_school_code" character varying NOT NULL, "external_school_code" character varying, "logo_url" character varying, "email" character varying, "phone" character varying, "total_classes" integer NOT NULL DEFAULT '0', "total_sections" integer NOT NULL DEFAULT '0', "total_students" integer NOT NULL DEFAULT '0', "total_teachers" integer NOT NULL DEFAULT '0', "address_area" character varying, "address_landmark" character varying, "address_city" character varying, "address_district" character varying, "address_state" character varying, "address_pincode" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_95b932e47ac129dd8e23a0db548" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."schools"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."schools"."school_name" IS 'School name'; COMMENT ON COLUMN "e_schooling"."schools"."internal_school_code" IS 'System generated unique school code'; COMMENT ON COLUMN "e_schooling"."schools"."external_school_code" IS 'External/Board provided school code'; COMMENT ON COLUMN "e_schooling"."schools"."logo_url" IS 'URL of the school logo'; COMMENT ON COLUMN "e_schooling"."schools"."email" IS 'School email'; COMMENT ON COLUMN "e_schooling"."schools"."phone" IS 'School phone'; COMMENT ON COLUMN "e_schooling"."schools"."total_classes" IS 'Total classes available'; COMMENT ON COLUMN "e_schooling"."schools"."total_sections" IS 'Total sections across all classes'; COMMENT ON COLUMN "e_schooling"."schools"."total_students" IS 'Total active students'; COMMENT ON COLUMN "e_schooling"."schools"."total_teachers" IS 'Total employed teachers'; COMMENT ON COLUMN "e_schooling"."schools"."address_area" IS 'Locality/Area'; COMMENT ON COLUMN "e_schooling"."schools"."address_landmark" IS 'Nearby landmark'; COMMENT ON COLUMN "e_schooling"."schools"."address_city" IS 'City'; COMMENT ON COLUMN "e_schooling"."schools"."address_district" IS 'District'; COMMENT ON COLUMN "e_schooling"."schools"."address_state" IS 'State'; COMMENT ON COLUMN "e_schooling"."schools"."address_pincode" IS 'Postal Pincode'; COMMENT ON COLUMN "e_schooling"."schools"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."schools"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."schools"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."schools"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."schools"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."schools"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1d18674afb00031593e736b79e" ON "e_schooling"."schools" ("internal_school_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_36003574eb0dd51df1e8eb085d" ON "e_schooling"."schools" ("external_school_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32447b0163c35b4eae18533104" ON "e_schooling"."schools" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_825aaedc40c4ae240b204fb22b" ON "e_schooling"."schools" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."students" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "admission_number" character varying, "student_code" character varying, "password_hash" character varying, "first_name" character varying, "last_name" character varying, "gender" character varying, "dob" date, "phone" character varying, "email" character varying, "parent_name" character varying, "parent_phone" character varying, "address" text, "profile_pic_url" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "state_id" bigint, "district_id" bigint, "place_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."students"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."students"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."students"."admission_number" IS 'Admission number'; COMMENT ON COLUMN "e_schooling"."students"."student_code" IS 'Unique student identification code used for login'; COMMENT ON COLUMN "e_schooling"."students"."password_hash" IS 'Hashed password'; COMMENT ON COLUMN "e_schooling"."students"."first_name" IS 'First name'; COMMENT ON COLUMN "e_schooling"."students"."last_name" IS 'Last name'; COMMENT ON COLUMN "e_schooling"."students"."gender" IS 'Gender'; COMMENT ON COLUMN "e_schooling"."students"."dob" IS 'Date of birth'; COMMENT ON COLUMN "e_schooling"."students"."phone" IS 'Phone number'; COMMENT ON COLUMN "e_schooling"."students"."email" IS 'Email'; COMMENT ON COLUMN "e_schooling"."students"."parent_name" IS 'Parent name'; COMMENT ON COLUMN "e_schooling"."students"."parent_phone" IS 'Parent phone'; COMMENT ON COLUMN "e_schooling"."students"."address" IS 'Physical address'; COMMENT ON COLUMN "e_schooling"."students"."profile_pic_url" IS 'URL of the student profile picture'; COMMENT ON COLUMN "e_schooling"."students"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."students"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."students"."created_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."students"."updated_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."students"."state_id" IS 'Reference to parent State'; COMMENT ON COLUMN "e_schooling"."students"."district_id" IS 'Reference to parent District'; COMMENT ON COLUMN "e_schooling"."students"."place_id" IS 'Reference to custom local Place/Village cluster'; COMMENT ON COLUMN "e_schooling"."students"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."students"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa8edc7905ad764f8592456964" ON "e_schooling"."students" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_94ea28a151d5f49f6bd4833466" ON "e_schooling"."students" ("student_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_24f98e457b1379cbca9d52c926" ON "e_schooling"."students" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_820ef09f63e994942694ee2d79" ON "e_schooling"."students" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."student_subjects" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "student_enrollment_id" bigint, "subject_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b3854d8a2bd41a6396b559a37c9" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."student_subjects"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."student_subjects"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."student_subjects"."student_enrollment_id" IS 'Reference to StudentEnrollment'; COMMENT ON COLUMN "e_schooling"."student_subjects"."subject_id" IS 'Reference to Subject'; COMMENT ON COLUMN "e_schooling"."student_subjects"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."student_subjects"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."student_subjects"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."student_subjects"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."student_subjects"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."student_subjects"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff46020ca83c08b39d942f1c8d" ON "e_schooling"."student_subjects" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72f1a3a2d7d3ae30eedaf7f0e4" ON "e_schooling"."student_subjects" ("student_enrollment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b15a9dded530d955f809d0a51c" ON "e_schooling"."student_subjects" ("subject_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."student_enrollments" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "student_id" bigint, "academic_session_id" bigint, "class_id" bigint, "section_id" bigint, "roll_number" character varying, "enrollment_type" character varying, "enrollment_state" character varying, "previous_enrollment_id" bigint, "is_current" boolean NOT NULL DEFAULT false, "start_date" date, "end_date" date, "joined_at" TIMESTAMP, "promoted_by" bigint, "promoted_at" TIMESTAMP, "remarks" text, "created_by_id" bigint, "updated_by_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_65f64fb270d4575b099b16e00a2" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."student_enrollments"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."student_id" IS 'Reference to Student'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."academic_session_id" IS 'Reference to AcademicSession'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."class_id" IS 'Reference to Class'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."section_id" IS 'Reference to Section'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."roll_number" IS 'Roll number'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."enrollment_type" IS 'admission | promotion | demotion | transfer | repeat | special_promotion'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."enrollment_state" IS 'active | promoted | demoted | transferred | completed | dropped'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."previous_enrollment_id" IS 'Reference to previous StudentEnrollment'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."is_current" IS 'Whether this is the student''s current active enrollment'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."start_date" IS 'Enrollment start date'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."end_date" IS 'Enrollment end date (set when student is promoted/transferred)'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."joined_at" IS 'Join timestamp'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."promoted_by" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."promoted_at" IS 'Promotion timestamp'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."remarks" IS 'Remarks'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."student_enrollments"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6969e646aa55906ab338683340" ON "e_schooling"."student_enrollments" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08caafd8a026a19ecf54db0e95" ON "e_schooling"."student_enrollments" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b94d7c4d18f9051328c6b867e" ON "e_schooling"."student_enrollments" ("academic_session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e875df488b1b297f25e3dff303" ON "e_schooling"."student_enrollments" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a504e03e002336b6bf7f17d621" ON "e_schooling"."student_enrollments" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1444cdd98942b1fb5c5c96492" ON "e_schooling"."student_enrollments" ("previous_enrollment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b55ac9e36c5beecab7d5318913" ON "e_schooling"."student_enrollments" ("promoted_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."promotion_logs" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "student_id" bigint, "from_enrollment_id" bigint, "to_enrollment_id" bigint, "from_class_id" bigint, "from_section_id" bigint, "to_class_id" bigint, "to_section_id" bigint, "action_type" character varying, "remarks" text, "performed_by" bigint, "performed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_397eb0d8be801b85f849b00a98e" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."promotion_logs"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."student_id" IS 'Reference to Student'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."from_enrollment_id" IS 'Reference to previous StudentEnrollment'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."to_enrollment_id" IS 'Reference to new StudentEnrollment'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."from_class_id" IS 'Reference to previous Class'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."from_section_id" IS 'Reference to previous Section'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."to_class_id" IS 'Reference to new Class'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."to_section_id" IS 'Reference to new Section'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."action_type" IS 'promotion | demotion | section_transfer'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."remarks" IS 'Promotion remarks'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."performed_by" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."performed_at" IS 'Performance timestamp'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."updated_at" IS 'Last update timestamp'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."promotion_logs"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38184378a786286542c7a32333" ON "e_schooling"."promotion_logs" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b7ee9bfdc841ad9f8ffd24831" ON "e_schooling"."promotion_logs" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e962eae8e33209811411255f0" ON "e_schooling"."promotion_logs" ("from_enrollment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ada3d21bc6783944ca86eea1e3" ON "e_schooling"."promotion_logs" ("to_enrollment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b646c3da3f75126de91eac867" ON "e_schooling"."promotion_logs" ("from_class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfc6dcfaf2fbf34776533d5a22" ON "e_schooling"."promotion_logs" ("from_section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f2b60e7465ade086f69e9db27" ON "e_schooling"."promotion_logs" ("to_class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20125cd3fa11f5336747250e47" ON "e_schooling"."promotion_logs" ("to_section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e379bdc626d3710a04ae902cb6" ON "e_schooling"."promotion_logs" ("performed_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."section_transfer_histories" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "student_enrollment_id" bigint, "old_section_id" bigint, "new_section_id" bigint, "reason" text, "changed_by" bigint, "changed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9f91b3a8c539bd710fb336a8bd2" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."student_enrollment_id" IS 'Reference to StudentEnrollment'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."old_section_id" IS 'Reference to old Section'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."new_section_id" IS 'Reference to new Section'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."reason" IS 'Transfer reason'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."changed_by" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."changed_at" IS 'Change timestamp'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."updated_at" IS 'Last update timestamp'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."section_transfer_histories"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b0083330322af1eb7d4eb6bda" ON "e_schooling"."section_transfer_histories" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07c2d205f9c5f0ae1102a4e9d0" ON "e_schooling"."section_transfer_histories" ("student_enrollment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_026eeeaabf062f1e6d58618d71" ON "e_schooling"."section_transfer_histories" ("old_section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6e9a0aa99bf0264209accddc1a" ON "e_schooling"."section_transfer_histories" ("new_section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94141f31a466d5f4d94ddc31fe" ON "e_schooling"."section_transfer_histories" ("changed_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_users" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "school_owner_id" bigint, "name" character varying, "username" character varying, "password_hash" character varying, "phone" character varying, "user_type" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "state_id" bigint, "district_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7bc83a5ce73acdf1e04a12fcefb" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_users"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_users"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."school_users"."school_owner_id" IS 'Reference to SchoolOwner'; COMMENT ON COLUMN "e_schooling"."school_users"."name" IS 'User name'; COMMENT ON COLUMN "e_schooling"."school_users"."username" IS 'Unique username'; COMMENT ON COLUMN "e_schooling"."school_users"."password_hash" IS 'Hashed password'; COMMENT ON COLUMN "e_schooling"."school_users"."phone" IS 'User phone number'; COMMENT ON COLUMN "e_schooling"."school_users"."user_type" IS 'admin | teacher | accountant | staff'; COMMENT ON COLUMN "e_schooling"."school_users"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_users"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_users"."created_by_id" IS 'Reference to SchoolOwner'; COMMENT ON COLUMN "e_schooling"."school_users"."updated_by_id" IS 'Reference to SchoolOwner'; COMMENT ON COLUMN "e_schooling"."school_users"."state_id" IS 'Reference to parent State'; COMMENT ON COLUMN "e_schooling"."school_users"."district_id" IS 'Reference to parent District'; COMMENT ON COLUMN "e_schooling"."school_users"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_users"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8db384570317692c95b9f5b0af" ON "e_schooling"."school_users" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b99fdd82ac692402dd706fe5d9" ON "e_schooling"."school_users" ("school_owner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fe2ae367ebf0e04694f5efd1d" ON "e_schooling"."school_users" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d053aec17866dca8c158c1a34" ON "e_schooling"."school_users" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_user_profiles" ("id" BIGSERIAL NOT NULL, "school_user_id" bigint NOT NULL, "father_name" character varying, "mother_name" character varying, "profile_pic_url" character varying, "dob" date, "aadhaar_number" character varying, "years_of_experience" integer, "previous_organization" character varying, "expertise" text, "subjects" text, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_8b2d28fa7d31e895296bd9180a" UNIQUE ("school_user_id"), CONSTRAINT "PK_a8a7ce26f73764602f3c4f7ffe8" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_user_profiles"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."school_user_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."father_name" IS 'Father name'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."mother_name" IS 'Mother name'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."profile_pic_url" IS 'Profile picture URL'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."dob" IS 'Date of birth'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."aadhaar_number" IS 'Aadhaar number'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."years_of_experience" IS 'Total years of experience'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."previous_organization" IS 'Last organization served'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."expertise" IS 'Area of expertise'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."subjects" IS 'Subjects handled (comma separated)'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_user_profiles"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8b2d28fa7d31e895296bd9180a" ON "e_schooling"."school_user_profiles" ("school_user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_owners" ("id" BIGSERIAL NOT NULL, "full_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "terms_accepted" boolean NOT NULL DEFAULT false, "password_hash" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5bc4959a9c8c194c4125195ec48" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_owners"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_owners"."full_name" IS 'Legal full name of the owner'; COMMENT ON COLUMN "e_schooling"."school_owners"."email" IS 'Primary contact and login email'; COMMENT ON COLUMN "e_schooling"."school_owners"."phone" IS 'Contact phone number (Mobile)'; COMMENT ON COLUMN "e_schooling"."school_owners"."terms_accepted" IS 'Whether user accepted terms and conditions'; COMMENT ON COLUMN "e_schooling"."school_owners"."password_hash" IS 'Bcrypt hashed password'; COMMENT ON COLUMN "e_schooling"."school_owners"."is_active" IS 'Account activation status'; COMMENT ON COLUMN "e_schooling"."school_owners"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_owners"."last_login_at" IS 'Last successful login timestamp'; COMMENT ON COLUMN "e_schooling"."school_owners"."created_at" IS 'Record creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_owners"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0b4821f8aa9f7fd71d282ad25f" ON "e_schooling"."school_owners" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e7224e60cb1678c5fe0dd1adf3" ON "e_schooling"."school_owners" ("phone") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_owner_members" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "school_owner_id" bigint, "role" character varying, "is_primary_owner" boolean, "invitation_state" character varying, "joined_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_96442d1c52d2084b600f3cc1caa" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_owner_members"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."school_owner_id" IS 'Reference to SchoolOwner'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."role" IS 'owner | admin | teacher | accountant | staff'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."is_primary_owner" IS 'Whether the user is the primary owner'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."invitation_state" IS 'pending | accepted | rejected'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."joined_at" IS 'Timestamp of joining'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."created_by_id" IS 'Reference to SchoolOwner'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."updated_by_id" IS 'Reference to SchoolOwner'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_owner_members"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_783a6e5f01860f74f965bff112" ON "e_schooling"."school_owner_members" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f1e0cabd538cea9313ee0ec7b2" ON "e_schooling"."school_owner_members" ("school_owner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8d1c19b2266db1d03cd2f19c5" ON "e_schooling"."school_owner_members" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b24867032add30a537c95b023" ON "e_schooling"."school_owner_members" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_03e152f5e2f528d4035d7e9192" ON "e_schooling"."school_owner_members" ("school_id", "school_owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_user_roles" ("id" BIGSERIAL NOT NULL, "user_id" bigint, "user_type" character varying DEFAULT 'school_user', "role_id" bigint, "created_by_id" bigint, "updated_by_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_45429c225aa266428d8b2c190c1" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_user_roles"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."user_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."user_type" IS 'Always school_user for this mapping'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."role_id" IS 'Reference to Role'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_user_roles"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d86cd4019b54b924962b54d2e" ON "e_schooling"."school_user_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb541e8a9363643b24a1ae44d0" ON "e_schooling"."school_user_roles" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_roles" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "name" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2ca0570efe3bdb508081317e1d2" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_roles"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_roles"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."school_roles"."name" IS 'Role name e.g. Teacher, HOD'; COMMENT ON COLUMN "e_schooling"."school_roles"."description" IS 'Role purpose'; COMMENT ON COLUMN "e_schooling"."school_roles"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_roles"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_roles"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."school_roles"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."school_roles"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_roles"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e70a3a4fedef1413416f4eec6" ON "e_schooling"."school_roles" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1562ef9115f615239e20507e28" ON "e_schooling"."school_roles" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d5822a048b536bd170fa7442e" ON "e_schooling"."school_roles" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_role_permissions" ("id" BIGSERIAL NOT NULL, "role_id" bigint NOT NULL, "permission_id" bigint NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_64d6c27681b5b3eaa7da443061a" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_role_permissions"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_role_permissions"."role_id" IS 'Reference to SchoolRole'; COMMENT ON COLUMN "e_schooling"."school_role_permissions"."permission_id" IS 'Reference to ModuleOperationPermission'; COMMENT ON COLUMN "e_schooling"."school_role_permissions"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_role_permissions"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_role_permissions"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."school_role_permissions"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_role_permissions"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f76a731b4d88ae5aef276d20e0" ON "e_schooling"."school_role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_203fe0f960c9371dc12d9329bb" ON "e_schooling"."school_role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1dc11b6231e32e4be54b5ad56b" ON "e_schooling"."school_role_permissions" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."operation_masters" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "code" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_by_id" bigint, "updated_by_id" bigint, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60dcfc6214309fdd4a401d80bc3" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."operation_masters"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."operation_masters"."name" IS 'Display operation name e.g. View, Create, Approve'; COMMENT ON COLUMN "e_schooling"."operation_masters"."code" IS 'Action shortcode e.g. VIEW, CREATE, UPDATE, DELETE'; COMMENT ON COLUMN "e_schooling"."operation_masters"."description" IS 'Action perimeter context'; COMMENT ON COLUMN "e_schooling"."operation_masters"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."operation_masters"."created_by_id" IS 'Creator tracking reference'; COMMENT ON COLUMN "e_schooling"."operation_masters"."updated_by_id" IS 'Updater tracking reference'; COMMENT ON COLUMN "e_schooling"."operation_masters"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."operation_masters"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."operation_masters"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bba0b6b06502fe53475e9c4e8b" ON "e_schooling"."operation_masters" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc8bea6f35fd119743d8ef50a1" ON "e_schooling"."operation_masters" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d4425075fcfa1fec22700896a" ON "e_schooling"."operation_masters" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."module_operation_permissions" ("id" BIGSERIAL NOT NULL, "module_id" bigint NOT NULL, "operation_id" bigint NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dcecb4efc9e68ae8c266a5e060a" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."module_operation_permissions"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."module_operation_permissions"."module_id" IS 'Reference to ModuleMaster'; COMMENT ON COLUMN "e_schooling"."module_operation_permissions"."operation_id" IS 'Reference to OperationMaster'; COMMENT ON COLUMN "e_schooling"."module_operation_permissions"."description" IS 'Permission description'; COMMENT ON COLUMN "e_schooling"."module_operation_permissions"."is_active" IS 'Active status'; COMMENT ON COLUMN "e_schooling"."module_operation_permissions"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4d4569dc96707ba0ef22783eb" ON "e_schooling"."module_operation_permissions" ("module_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb822e3c6336c34567ccf20605" ON "e_schooling"."module_operation_permissions" ("operation_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."module_masters" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "code" character varying NOT NULL, "description" text, "platform_feature_id" bigint, "parent_module_id" bigint, "route_path" character varying, "icon" character varying, "display_order" integer NOT NULL DEFAULT '0', "show_in_sidebar" boolean NOT NULL DEFAULT true, "is_menu_group" boolean NOT NULL DEFAULT false, "is_visible" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT true, "created_by_id" bigint, "updated_by_id" bigint, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dd570f65fae5a597b94e3e88576" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."module_masters"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."module_masters"."name" IS 'Display name e.g. Attendance Management, Fee Management'; COMMENT ON COLUMN "e_schooling"."module_masters"."code" IS 'System mapping code e.g. ATTENDANCE, FEES, ADMISSION'; COMMENT ON COLUMN "e_schooling"."module_masters"."description" IS 'Module domain capabilities description'; COMMENT ON COLUMN "e_schooling"."module_masters"."platform_feature_id" IS 'Reference to underlying PlatformFeature metered/billed capability'; COMMENT ON COLUMN "e_schooling"."module_masters"."parent_module_id" IS 'Self reference for nested menu tree'; COMMENT ON COLUMN "e_schooling"."module_masters"."route_path" IS 'Frontend route path'; COMMENT ON COLUMN "e_schooling"."module_masters"."icon" IS 'Menu icon identifier'; COMMENT ON COLUMN "e_schooling"."module_masters"."display_order" IS 'Order in sidebar'; COMMENT ON COLUMN "e_schooling"."module_masters"."show_in_sidebar" IS 'Visibility toggle for sidebar'; COMMENT ON COLUMN "e_schooling"."module_masters"."is_menu_group" IS 'True if this is just a folder/label'; COMMENT ON COLUMN "e_schooling"."module_masters"."is_visible" IS 'Dynamic visibility toggle'; COMMENT ON COLUMN "e_schooling"."module_masters"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."module_masters"."created_by_id" IS 'Creator tracking reference'; COMMENT ON COLUMN "e_schooling"."module_masters"."updated_by_id" IS 'Updater tracking reference'; COMMENT ON COLUMN "e_schooling"."module_masters"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."module_masters"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."module_masters"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f83011840c58244c3c168dff96" ON "e_schooling"."module_masters" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_50c324613bd7a9c818b0c3d847" ON "e_schooling"."module_masters" ("platform_feature_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a8a3d28bf57e952510a7a1e3c" ON "e_schooling"."module_masters" ("parent_module_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b14c767ac067eae906be9c994" ON "e_schooling"."module_masters" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_037b8927ffaea584d334a8b8a8" ON "e_schooling"."module_masters" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."platform_users" ("id" BIGSERIAL NOT NULL, "name" character varying, "email" character varying, "password_hash" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_69bfedb2b67d1014d7b7741f5b4" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."platform_users"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."platform_users"."name" IS 'User full name'; COMMENT ON COLUMN "e_schooling"."platform_users"."email" IS 'User email address'; COMMENT ON COLUMN "e_schooling"."platform_users"."password_hash" IS 'Hashed password'; COMMENT ON COLUMN "e_schooling"."platform_users"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."platform_users"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."platform_users"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."platform_users"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b616fa69a7b331fc2a7906a83d" ON "e_schooling"."platform_users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."platform_roles" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_598e373288278aa5dc8f1c2731b" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."platform_roles"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."platform_roles"."name" IS 'Role name e.g. SUPER_ADMIN, SUPPORT_LEVEL_1'; COMMENT ON COLUMN "e_schooling"."platform_roles"."description" IS 'Role description'; COMMENT ON COLUMN "e_schooling"."platform_roles"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."platform_roles"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."platform_roles"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."platform_roles"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5da1bac52ad77c7897fc53b6ff" ON "e_schooling"."platform_roles" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."platform_user_role_mappings" ("id" BIGSERIAL NOT NULL, "platform_user_id" bigint NOT NULL, "platform_role_id" bigint NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba3af37eb059e0a4f272ca4520e" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."platform_user_role_mappings"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."platform_user_role_mappings"."platform_user_id" IS 'Reference to PlatformUser'; COMMENT ON COLUMN "e_schooling"."platform_user_role_mappings"."platform_role_id" IS 'Reference to PlatformRole'; COMMENT ON COLUMN "e_schooling"."platform_user_role_mappings"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."platform_user_role_mappings"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."platform_user_role_mappings"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."platform_user_role_mappings"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a3ac0f41336a3f2cf1935f5e7" ON "e_schooling"."platform_user_role_mappings" ("platform_user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2c2ff0e5799636974421994ee" ON "e_schooling"."platform_user_role_mappings" ("platform_role_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."platform_role_permissions" ("id" BIGSERIAL NOT NULL, "platform_role_id" bigint NOT NULL, "permission_id" bigint NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1a96f962fe49e23def38e87288a" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."platform_role_permissions"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."platform_role_permissions"."platform_role_id" IS 'Reference to PlatformRole'; COMMENT ON COLUMN "e_schooling"."platform_role_permissions"."permission_id" IS 'Reference to ModuleOperationPermission'; COMMENT ON COLUMN "e_schooling"."platform_role_permissions"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."platform_role_permissions"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."platform_role_permissions"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."platform_role_permissions"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_564ba7e8b4f37a6c26941a7b8a" ON "e_schooling"."platform_role_permissions" ("platform_role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51f68c8bbf4a14abafe4710d07" ON "e_schooling"."platform_role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."states" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "code" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_09ab30ca0975c02656483265f4f" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."states"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."states"."name" IS 'State or Union Territory name'; COMMENT ON COLUMN "e_schooling"."states"."code" IS 'ISO or standardized short code e.g. MH, UP, KA'; COMMENT ON COLUMN "e_schooling"."states"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."states"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."states"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."states"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fe52f02449eaf27be2b2cb7acd" ON "e_schooling"."states" ("name") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b8af4194277281dcfe08be4264" ON "e_schooling"."states" ("code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."places" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "district_id" bigint NOT NULL, "name" character varying NOT NULL, "pincode" character varying, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1afab86e226b4c3bc9a74465c12" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."places"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."places"."school_id" IS 'Target tenant branch customizing this place'; COMMENT ON COLUMN "e_schooling"."places"."district_id" IS 'Reference to parent District'; COMMENT ON COLUMN "e_schooling"."places"."name" IS 'Village, City, or custom local cluster name'; COMMENT ON COLUMN "e_schooling"."places"."pincode" IS 'Postal code'; COMMENT ON COLUMN "e_schooling"."places"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."places"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."places"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."places"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db640120300f416e8a4f378378" ON "e_schooling"."places" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfba2f9940cee5476891a2e0bd" ON "e_schooling"."places" ("district_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d93026712ed97941ccec28f813" ON "e_schooling"."places" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."districts" ("id" BIGSERIAL NOT NULL, "state_id" bigint NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_972a72ff4e3bea5c7f43a2b98af" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."districts"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."districts"."state_id" IS 'Reference to parent State'; COMMENT ON COLUMN "e_schooling"."districts"."name" IS 'District name'; COMMENT ON COLUMN "e_schooling"."districts"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."districts"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."districts"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."districts"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18b176b7f592f3a1c55d5e43a8" ON "e_schooling"."districts" ("state_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6a6fd6d258022e5576afbad90b" ON "e_schooling"."districts" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."orders" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "school_owner_id" bigint NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'INR', "status" character varying NOT NULL DEFAULT 'pending', "razorpay_order_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."orders"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."orders"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."orders"."school_owner_id" IS 'Reference to SchoolOwner'; COMMENT ON COLUMN "e_schooling"."orders"."amount" IS 'Order total amount'; COMMENT ON COLUMN "e_schooling"."orders"."currency" IS 'Currency code'; COMMENT ON COLUMN "e_schooling"."orders"."status" IS 'Current order status'; COMMENT ON COLUMN "e_schooling"."orders"."razorpay_order_id" IS 'ID generated by Razorpay'; COMMENT ON COLUMN "e_schooling"."orders"."metadata" IS 'Details about what is being purchased'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f553b00960d669fd62c4065f9" ON "e_schooling"."orders" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32908dca5186abe38711a33301" ON "e_schooling"."orders" ("school_owner_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a493914f314964159c6fb6fe5f" ON "e_schooling"."orders" ("razorpay_order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."payments" ("id" BIGSERIAL NOT NULL, "order_id" bigint, "school_subscription_id" bigint, "school_id" bigint, "transaction_id" character varying, "payment_gateway" character varying, "gateway_payment_id" character varying, "amount" numeric, "currency" character varying, "payment_state" character varying, "paid_at" TIMESTAMP, "invoice_url" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."payments"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."payments"."order_id" IS 'Reference to Order'; COMMENT ON COLUMN "e_schooling"."payments"."school_subscription_id" IS 'Reference to SchoolSubscription'; COMMENT ON COLUMN "e_schooling"."payments"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."payments"."transaction_id" IS 'Transaction ID'; COMMENT ON COLUMN "e_schooling"."payments"."payment_gateway" IS 'razorpay | stripe | cashfree'; COMMENT ON COLUMN "e_schooling"."payments"."gateway_payment_id" IS 'Gateway Payment ID'; COMMENT ON COLUMN "e_schooling"."payments"."amount" IS 'Payment amount'; COMMENT ON COLUMN "e_schooling"."payments"."currency" IS 'Payment currency'; COMMENT ON COLUMN "e_schooling"."payments"."payment_state" IS 'pending | success | failed | refunded'; COMMENT ON COLUMN "e_schooling"."payments"."paid_at" IS 'Payment timestamp'; COMMENT ON COLUMN "e_schooling"."payments"."invoice_url" IS 'Invoice PDF URL'; COMMENT ON COLUMN "e_schooling"."payments"."metadata" IS 'Additional metadata'; COMMENT ON COLUMN "e_schooling"."payments"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."payments"."updated_at" IS 'Last update timestamp'; COMMENT ON COLUMN "e_schooling"."payments"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."payments"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2f7b823a21562eeca20e72b00" ON "e_schooling"."payments" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae667448019e43185b882a8268" ON "e_schooling"."payments" ("school_subscription_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2903a85d0b818dfc9940b32b52" ON "e_schooling"."payments" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."invoices" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "school_subscription_id" bigint, "invoice_number" character varying, "subtotal" numeric, "tax" numeric, "total" numeric, "due_date" date, "invoice_state" character varying, "invoice_pdf_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."invoices"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."invoices"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."invoices"."school_subscription_id" IS 'Reference to SchoolSubscription'; COMMENT ON COLUMN "e_schooling"."invoices"."invoice_number" IS 'Invoice number'; COMMENT ON COLUMN "e_schooling"."invoices"."subtotal" IS 'Subtotal amount'; COMMENT ON COLUMN "e_schooling"."invoices"."tax" IS 'Tax amount'; COMMENT ON COLUMN "e_schooling"."invoices"."total" IS 'Total amount'; COMMENT ON COLUMN "e_schooling"."invoices"."due_date" IS 'Due date'; COMMENT ON COLUMN "e_schooling"."invoices"."invoice_state" IS 'paid | unpaid | overdue'; COMMENT ON COLUMN "e_schooling"."invoices"."invoice_pdf_url" IS 'Invoice PDF URL'; COMMENT ON COLUMN "e_schooling"."invoices"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."invoices"."updated_at" IS 'Last update timestamp'; COMMENT ON COLUMN "e_schooling"."invoices"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."invoices"."is_delete" IS 'Soft delete marker'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac326c0a4b9c1227a8c2dfb0fd" ON "e_schooling"."invoices" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf38e38c19a27638fcf9193be0" ON "e_schooling"."invoices" ("school_subscription_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."school_feature_overrides" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "platform_feature_id" bigint NOT NULL, "override_type" character varying NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "custom_price" numeric(12,2), "billing_cycle" character varying, "limit_value" bigint, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "remarks" text, "created_by" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1e33e374d04c80f8776b5093e60" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."school_id" IS 'Target School branch context'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."platform_feature_id" IS 'Target PlatformFeature reference'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."override_type" IS 'ENABLE | DISABLE | CUSTOM_PRICE | CUSTOM_LIMIT | FREE_ACCESS'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."is_enabled" IS 'Feature toggle override state'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."custom_price" IS 'Custom enterprise price mapping'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."billing_cycle" IS 'MONTHLY | YEARLY | ONE_TIME'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."limit_value" IS 'Tenant custom cap overriding global plan'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."start_date" IS 'Custom access boundary activation'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."end_date" IS 'Custom access expiration. Null signifies endless'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."remarks" IS 'Administrative approval context notes'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."created_by" IS 'Platform user ID who enacted override'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."school_feature_overrides"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21f663263d193f1b186c8975f2" ON "e_schooling"."school_feature_overrides" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_19266bb9a912799a067061dbd2" ON "e_schooling"."school_feature_overrides" ("platform_feature_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e66df81e2a04ada78b7df78910" ON "e_schooling"."school_feature_overrides" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."platform_feature_usage_logs" ("id" BIGSERIAL NOT NULL, "school_id" bigint NOT NULL, "platform_feature_id" bigint NOT NULL, "usage_count" bigint NOT NULL DEFAULT '1', "usage_date" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ffe964a3a056eca10d9ac66f6ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."school_id" IS 'Target school context consuming resource'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."platform_feature_id" IS 'Target PlatformFeature reference'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."usage_count" IS 'Units consumed in event tracking payload'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."usage_date" IS 'Timestamp of consumption'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."metadata" IS 'Event telemetry tracking details'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."platform_feature_usage_logs"."created_at" IS 'Creation log insertion timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_972f34ceeb0d65a5eb13e78fdc" ON "e_schooling"."platform_feature_usage_logs" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3f858ae9d8989a4677c8bfa22" ON "e_schooling"."platform_feature_usage_logs" ("platform_feature_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."plaform_feature_prices" ("id" BIGSERIAL NOT NULL, "platform_feature_id" bigint NOT NULL, "billing_cycle" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_90972ce59cb56e50fcc47f37135" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."plaform_feature_prices"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."plaform_feature_prices"."platform_feature_id" IS 'Reference to PlatformFeature'; COMMENT ON COLUMN "e_schooling"."plaform_feature_prices"."billing_cycle" IS 'monthly | yearly | per_unit'; COMMENT ON COLUMN "e_schooling"."plaform_feature_prices"."price" IS 'Price for the specific cycle'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2d8891c34f9ba8645a96de064" ON "e_schooling"."plaform_feature_prices" ("platform_feature_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a69fc05c67a7304fd3a7f8d811" ON "e_schooling"."plaform_feature_prices" ("platform_feature_id", "billing_cycle") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."background_jobs" ("id" BIGSERIAL NOT NULL, "job_id" character varying(100) NOT NULL, "queue_name" character varying(100) NOT NULL, "job_type" character varying(100) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'pending', "payload" jsonb, "response" jsonb, "error" jsonb, "attempts" integer NOT NULL DEFAULT '0', "max_attempts" integer NOT NULL DEFAULT '3', "progress" integer NOT NULL DEFAULT '0', "priority" integer NOT NULL DEFAULT '0', "delay" integer NOT NULL DEFAULT '0', "cron_expression" character varying(100), "tenant_id" bigint, "created_by" bigint, "metadata" jsonb, "scheduled_at" TIMESTAMP, "processed_at" TIMESTAMP, "completed_at" TIMESTAMP, "failed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1f31731b1a02806c4aa631acb8" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."background_jobs"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."background_jobs"."job_id" IS 'BullMQ unique Job ID'; COMMENT ON COLUMN "e_schooling"."background_jobs"."queue_name" IS 'Target queue name'; COMMENT ON COLUMN "e_schooling"."background_jobs"."job_type" IS 'Job Type action mapping'; COMMENT ON COLUMN "e_schooling"."background_jobs"."status" IS 'Current job execution status'; COMMENT ON COLUMN "e_schooling"."background_jobs"."payload" IS 'Input parameter parameters payload'; COMMENT ON COLUMN "e_schooling"."background_jobs"."response" IS 'Successful execution result response'; COMMENT ON COLUMN "e_schooling"."background_jobs"."error" IS 'Failure error stack and logs'; COMMENT ON COLUMN "e_schooling"."background_jobs"."attempts" IS 'Total attempts made to run the job'; COMMENT ON COLUMN "e_schooling"."background_jobs"."max_attempts" IS 'Maximum retry threshold ceiling'; COMMENT ON COLUMN "e_schooling"."background_jobs"."progress" IS 'Progress metrics between 0 and 100'; COMMENT ON COLUMN "e_schooling"."background_jobs"."priority" IS 'Execution priority rating'; COMMENT ON COLUMN "e_schooling"."background_jobs"."delay" IS 'Execution delay interval length in milliseconds'; COMMENT ON COLUMN "e_schooling"."background_jobs"."cron_expression" IS 'Cron pattern if reproducible task'; COMMENT ON COLUMN "e_schooling"."background_jobs"."tenant_id" IS 'School context binding ID'; COMMENT ON COLUMN "e_schooling"."background_jobs"."created_by" IS 'User index triggering task creation'; COMMENT ON COLUMN "e_schooling"."background_jobs"."metadata" IS 'Custom audit and execution context fields'; COMMENT ON COLUMN "e_schooling"."background_jobs"."scheduled_at" IS 'Time job is scheduled to execute'; COMMENT ON COLUMN "e_schooling"."background_jobs"."processed_at" IS 'Time processing actually starts'; COMMENT ON COLUMN "e_schooling"."background_jobs"."completed_at" IS 'Completion confirmation time'; COMMENT ON COLUMN "e_schooling"."background_jobs"."failed_at" IS 'Failure trigger time'; COMMENT ON COLUMN "e_schooling"."background_jobs"."created_at" IS 'Creation date'; COMMENT ON COLUMN "e_schooling"."background_jobs"."updated_at" IS 'Last updated time'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9ef6cdb46e2bfd2e11d39e001e" ON "e_schooling"."background_jobs" ("job_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7c197730d8a7fb778bca7f167e" ON "e_schooling"."background_jobs" ("queue_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c354fa469452250be305c13a19" ON "e_schooling"."background_jobs" ("job_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9fd0af323fb1e9f58f635739c0" ON "e_schooling"."background_jobs" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b27b623a84d01cfe810c9f555" ON "e_schooling"."background_jobs" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9d85061f41e2c59fd79a959719" ON "e_schooling"."background_jobs" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."attendance_sessions" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "academic_session_id" bigint, "class_id" bigint, "section_id" bigint, "date" date, "session_slot" integer NOT NULL DEFAULT '1', "taken_by" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_84d565d9e484e2bcdaf4a9e1890" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."attendance_sessions"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."academic_session_id" IS 'Reference to AcademicSession'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."class_id" IS 'Reference to Class'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."section_id" IS 'Reference to Section'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."date" IS 'Attendance date'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."session_slot" IS 'Attendance session slot/slot number'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."taken_by" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."attendance_sessions"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d08083dfbf6ed58428b3bf68a0" ON "e_schooling"."attendance_sessions" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37909c21160908c51c5d1a3575" ON "e_schooling"."attendance_sessions" ("academic_session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fc552e07b31ac92445cd3e21f" ON "e_schooling"."attendance_sessions" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d56a8496d0a16825622f49dc6" ON "e_schooling"."attendance_sessions" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6e7bc09414e6bec8d7988872d6" ON "e_schooling"."attendance_sessions" ("taken_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."attendance_records" ("id" BIGSERIAL NOT NULL, "session_id" bigint, "student_enrollment_id" bigint, "attendance_mark" character varying, "remarks" text, "created_by_id" bigint, "updated_by_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_946920332f5bc9efad3f3023b96" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."attendance_records"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."attendance_records"."session_id" IS 'Reference to AttendanceSession'; COMMENT ON COLUMN "e_schooling"."attendance_records"."student_enrollment_id" IS 'Reference to StudentEnrollment'; COMMENT ON COLUMN "e_schooling"."attendance_records"."attendance_mark" IS 'present | absent | leave | half_day'; COMMENT ON COLUMN "e_schooling"."attendance_records"."remarks" IS 'Attendance remarks'; COMMENT ON COLUMN "e_schooling"."attendance_records"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."attendance_records"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."attendance_records"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."attendance_records"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."attendance_records"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."attendance_records"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c51be2c1149e22de76b17626cb" ON "e_schooling"."attendance_records" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0797e62f15f78d1c767c7073cb" ON "e_schooling"."attendance_records" ("student_enrollment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."teacher_section_assignments" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "teacher_id" bigint, "class_id" bigint, "section_id" bigint, "is_class_teacher" boolean, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f7ab875f17bccb15da3228a1658" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."teacher_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."class_id" IS 'Reference to Class'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."section_id" IS 'Reference to Section'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."is_class_teacher" IS 'Whether this teacher is the class teacher'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."teacher_section_assignments"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_df334827b674191f5a5a68b446" ON "e_schooling"."teacher_section_assignments" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ddd2f99a03a6ec49066f91bc31" ON "e_schooling"."teacher_section_assignments" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49b0e1a285acda8ae876df878e" ON "e_schooling"."teacher_section_assignments" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8bf63a40ba19e177319830645f" ON "e_schooling"."teacher_section_assignments" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."subjects" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "name" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_by_id" bigint, "updated_by_id" bigint, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."subjects"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."subjects"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."subjects"."name" IS 'Subject name'; COMMENT ON COLUMN "e_schooling"."subjects"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."subjects"."created_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."subjects"."updated_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."subjects"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."subjects"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."subjects"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07a82eb883094a6990b914cc15" ON "e_schooling"."subjects" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_85559b09f6515db5a67609f1e0" ON "e_schooling"."subjects" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_318996ce5920bda252b84a86ca" ON "e_schooling"."subjects" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."classes" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "name" character varying, "has_sections" boolean, "daily_attendance_limit" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "created_by_id" bigint, "updated_by_id" bigint, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."classes"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."classes"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."classes"."name" IS 'Class name'; COMMENT ON COLUMN "e_schooling"."classes"."has_sections" IS 'Whether class has multiple sections'; COMMENT ON COLUMN "e_schooling"."classes"."daily_attendance_limit" IS 'Max attendance sessions per day'; COMMENT ON COLUMN "e_schooling"."classes"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."classes"."created_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."classes"."updated_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."classes"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."classes"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."classes"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_398f3990f5da4a1efda173f576" ON "e_schooling"."classes" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bbd729aa9f84d9327722ee2e76" ON "e_schooling"."classes" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e13ab8b77ca3a2c1d07f343c5a" ON "e_schooling"."classes" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."sections" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "class_id" bigint, "name" character varying, "is_default" boolean, "is_active" boolean NOT NULL DEFAULT true, "created_by_id" bigint, "updated_by_id" bigint, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9749dd3bffd880a497d007e450" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."sections"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."sections"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."sections"."class_id" IS 'Reference to Class'; COMMENT ON COLUMN "e_schooling"."sections"."name" IS 'Section name'; COMMENT ON COLUMN "e_schooling"."sections"."is_default" IS 'Is default section'; COMMENT ON COLUMN "e_schooling"."sections"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."sections"."created_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."sections"."updated_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."sections"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."sections"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."sections"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff9259b86078bdc799eab2ee8e" ON "e_schooling"."sections" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27db91d7369af6f181412afa99" ON "e_schooling"."sections" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0929781c5fd4cba2a7b9ada70" ON "e_schooling"."sections" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20126cc6f6f524ee21f966315a" ON "e_schooling"."sections" ("updated_by_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."class_section_subjects" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "class_id" bigint, "section_id" bigint, "subject_id" bigint, "teacher_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "created_by_id" bigint, "updated_by_id" bigint, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d45ad6f5001785b8e0ca7ec691" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."class_section_subjects"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."class_id" IS 'Reference to Class'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."section_id" IS 'Reference to Section'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."subject_id" IS 'Reference to Subject'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."teacher_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."created_by_id" IS 'Reference to Creator'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."updated_by_id" IS 'Reference to Updater'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."class_section_subjects"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_abecee0f6162a053e04cf51078" ON "e_schooling"."class_section_subjects" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_554455508663f749acbd6e45c6" ON "e_schooling"."class_section_subjects" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ec6b4b6466894d1827dc26e5c" ON "e_schooling"."class_section_subjects" ("section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c0a48168f56a2804d4d78b8fb" ON "e_schooling"."class_section_subjects" ("subject_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c5b99a455bec55d6eb59e713a3" ON "e_schooling"."class_section_subjects" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "e_schooling"."academic_sessions" ("id" BIGSERIAL NOT NULL, "school_id" bigint, "name" character varying, "start_date" date, "end_date" date, "is_current" boolean, "is_active" boolean NOT NULL DEFAULT true, "is_delete" boolean NOT NULL DEFAULT false, "created_by_id" bigint, "updated_by_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8dba9ed9bef819af7a31769c04b" PRIMARY KEY ("id")); COMMENT ON COLUMN "e_schooling"."academic_sessions"."id" IS 'Primary key'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."school_id" IS 'Reference to School'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."name" IS 'Session name (e.g. 2025-2026)'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."start_date" IS 'Session start date'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."end_date" IS 'Session end date'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."is_current" IS 'Is this the current session'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."is_active" IS 'Active status toggle'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."is_delete" IS 'Soft delete marker'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."created_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."updated_by_id" IS 'Reference to SchoolUser'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."created_at" IS 'Creation timestamp'; COMMENT ON COLUMN "e_schooling"."academic_sessions"."updated_at" IS 'Last update timestamp'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e982b90bf896e2d637f56b57ad" ON "e_schooling"."academic_sessions" ("school_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70c655a10518d404118b63facc" ON "e_schooling"."academic_sessions" ("created_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9953f6a6b9e3edfe2c74b7b92" ON "e_schooling"."academic_sessions" ("updated_by_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."subscription_plan_prices" ADD CONSTRAINT "FK_35dfa5e6546954af557d5f1cd1a" FOREIGN KEY ("subscription_plan_id") REFERENCES "e_schooling"."subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."subscription_plan_platform_feature_mappings" ADD CONSTRAINT "FK_cc1b0c538b7cb9aa972c5ba3da1" FOREIGN KEY ("subscription_plan_id") REFERENCES "e_schooling"."subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."subscription_plan_platform_feature_mappings" ADD CONSTRAINT "FK_97264083451de63d64801751f29" FOREIGN KEY ("platform_feature_id") REFERENCES "e_schooling"."platform_features"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."school_subscriptions" ADD CONSTRAINT "FK_c6b0d048e330af6d4fd91594ce8" FOREIGN KEY ("subscription_plan_id") REFERENCES "e_schooling"."subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."students" ADD CONSTRAINT "FK_aa8edc7905ad764f85924569647" FOREIGN KEY ("school_id") REFERENCES "e_schooling"."schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."school_users" ADD CONSTRAINT "FK_8db384570317692c95b9f5b0af7" FOREIGN KEY ("school_id") REFERENCES "e_schooling"."schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."school_user_profiles" ADD CONSTRAINT "FK_8b2d28fa7d31e895296bd9180a1" FOREIGN KEY ("school_user_id") REFERENCES "e_schooling"."school_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."platform_user_role_mappings" ADD CONSTRAINT "FK_d2c2ff0e5799636974421994eee" FOREIGN KEY ("platform_role_id") REFERENCES "e_schooling"."platform_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "e_schooling"."orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."plaform_feature_prices" ADD CONSTRAINT "FK_b2d8891c34f9ba8645a96de064f" FOREIGN KEY ("platform_feature_id") REFERENCES "e_schooling"."platform_features"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."sections" ADD CONSTRAINT "FK_27db91d7369af6f181412afa99f" FOREIGN KEY ("class_id") REFERENCES "e_schooling"."classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."sections" DROP CONSTRAINT "FK_27db91d7369af6f181412afa99f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."plaform_feature_prices" DROP CONSTRAINT "FK_b2d8891c34f9ba8645a96de064f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."platform_user_role_mappings" DROP CONSTRAINT "FK_d2c2ff0e5799636974421994eee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."school_user_profiles" DROP CONSTRAINT "FK_8b2d28fa7d31e895296bd9180a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."school_users" DROP CONSTRAINT "FK_8db384570317692c95b9f5b0af7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."students" DROP CONSTRAINT "FK_aa8edc7905ad764f85924569647"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."school_subscriptions" DROP CONSTRAINT "FK_c6b0d048e330af6d4fd91594ce8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."subscription_plan_platform_feature_mappings" DROP CONSTRAINT "FK_97264083451de63d64801751f29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."subscription_plan_platform_feature_mappings" DROP CONSTRAINT "FK_cc1b0c538b7cb9aa972c5ba3da1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "e_schooling"."subscription_plan_prices" DROP CONSTRAINT "FK_35dfa5e6546954af557d5f1cd1a"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_e9953f6a6b9e3edfe2c74b7b92"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_70c655a10518d404118b63facc"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_e982b90bf896e2d637f56b57ad"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."academic_sessions"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_c5b99a455bec55d6eb59e713a3"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_1c0a48168f56a2804d4d78b8fb"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_8ec6b4b6466894d1827dc26e5c"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_554455508663f749acbd6e45c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_abecee0f6162a053e04cf51078"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."class_section_subjects"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_20126cc6f6f524ee21f966315a"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_a0929781c5fd4cba2a7b9ada70"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_27db91d7369af6f181412afa99"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ff9259b86078bdc799eab2ee8e"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."sections"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_e13ab8b77ca3a2c1d07f343c5a"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_bbd729aa9f84d9327722ee2e76"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_398f3990f5da4a1efda173f576"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."classes"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_318996ce5920bda252b84a86ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_85559b09f6515db5a67609f1e0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_07a82eb883094a6990b914cc15"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."subjects"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_8bf63a40ba19e177319830645f"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_49b0e1a285acda8ae876df878e"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ddd2f99a03a6ec49066f91bc31"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_df334827b674191f5a5a68b446"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."teacher_section_assignments"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0797e62f15f78d1c767c7073cb"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_c51be2c1149e22de76b17626cb"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."attendance_records"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_6e7bc09414e6bec8d7988872d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_5d56a8496d0a16825622f49dc6"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_6fc552e07b31ac92445cd3e21f"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_37909c21160908c51c5d1a3575"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_d08083dfbf6ed58428b3bf68a0"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."attendance_sessions"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_9d85061f41e2c59fd79a959719"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_4b27b623a84d01cfe810c9f555"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_9fd0af323fb1e9f58f635739c0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_c354fa469452250be305c13a19"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_7c197730d8a7fb778bca7f167e"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_9ef6cdb46e2bfd2e11d39e001e"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."background_jobs"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_a69fc05c67a7304fd3a7f8d811"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_b2d8891c34f9ba8645a96de064"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."plaform_feature_prices"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_c3f858ae9d8989a4677c8bfa22"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_972f34ceeb0d65a5eb13e78fdc"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."platform_feature_usage_logs"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_e66df81e2a04ada78b7df78910"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_19266bb9a912799a067061dbd2"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_21f663263d193f1b186c8975f2"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."school_feature_overrides"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_bf38e38c19a27638fcf9193be0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ac326c0a4b9c1227a8c2dfb0fd"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."invoices"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_2903a85d0b818dfc9940b32b52"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ae667448019e43185b882a8268"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_b2f7b823a21562eeca20e72b00"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."payments"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_a493914f314964159c6fb6fe5f"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_32908dca5186abe38711a33301"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0f553b00960d669fd62c4065f9"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."orders"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_6a6fd6d258022e5576afbad90b"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_18b176b7f592f3a1c55d5e43a8"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."districts"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_d93026712ed97941ccec28f813"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_cfba2f9940cee5476891a2e0bd"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_db640120300f416e8a4f378378"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."places"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_b8af4194277281dcfe08be4264"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_fe52f02449eaf27be2b2cb7acd"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."states"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_51f68c8bbf4a14abafe4710d07"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_564ba7e8b4f37a6c26941a7b8a"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."platform_role_permissions"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_d2c2ff0e5799636974421994ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_4a3ac0f41336a3f2cf1935f5e7"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."platform_user_role_mappings"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_5da1bac52ad77c7897fc53b6ff"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."platform_roles"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_b616fa69a7b331fc2a7906a83d"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."platform_users"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_037b8927ffaea584d334a8b8a8"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0b14c767ac067eae906be9c994"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_1a8a3d28bf57e952510a7a1e3c"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_50c324613bd7a9c818b0c3d847"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_f83011840c58244c3c168dff96"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."module_masters"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_bb822e3c6336c34567ccf20605"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_f4d4569dc96707ba0ef22783eb"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."module_operation_permissions"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_2d4425075fcfa1fec22700896a"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_dc8bea6f35fd119743d8ef50a1"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_bba0b6b06502fe53475e9c4e8b"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."operation_masters"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_1dc11b6231e32e4be54b5ad56b"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_203fe0f960c9371dc12d9329bb"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_f76a731b4d88ae5aef276d20e0"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."school_role_permissions"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_5d5822a048b536bd170fa7442e"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_1562ef9115f615239e20507e28"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0e70a3a4fedef1413416f4eec6"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."school_roles"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_bb541e8a9363643b24a1ae44d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_8d86cd4019b54b924962b54d2e"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."school_user_roles"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_03e152f5e2f528d4035d7e9192"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_8b24867032add30a537c95b023"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_f8d1c19b2266db1d03cd2f19c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_f1e0cabd538cea9313ee0ec7b2"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_783a6e5f01860f74f965bff112"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."school_owner_members"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_e7224e60cb1678c5fe0dd1adf3"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0b4821f8aa9f7fd71d282ad25f"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."school_owners"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_8b2d28fa7d31e895296bd9180a"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."school_user_profiles"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_3d053aec17866dca8c158c1a34"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_6fe2ae367ebf0e04694f5efd1d"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_b99fdd82ac692402dd706fe5d9"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_8db384570317692c95b9f5b0af"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."school_users"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_94141f31a466d5f4d94ddc31fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_6e9a0aa99bf0264209accddc1a"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_026eeeaabf062f1e6d58618d71"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_07c2d205f9c5f0ae1102a4e9d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_6b0083330322af1eb7d4eb6bda"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."section_transfer_histories"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_e379bdc626d3710a04ae902cb6"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_20125cd3fa11f5336747250e47"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_1f2b60e7465ade086f69e9db27"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_cfc6dcfaf2fbf34776533d5a22"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_7b646c3da3f75126de91eac867"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ada3d21bc6783944ca86eea1e3"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_8e962eae8e33209811411255f0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_0b7ee9bfdc841ad9f8ffd24831"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_38184378a786286542c7a32333"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."promotion_logs"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_b55ac9e36c5beecab7d5318913"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_c1444cdd98942b1fb5c5c96492"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_a504e03e002336b6bf7f17d621"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_e875df488b1b297f25e3dff303"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_7b94d7c4d18f9051328c6b867e"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_08caafd8a026a19ecf54db0e95"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_6969e646aa55906ab338683340"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."student_enrollments"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_b15a9dded530d955f809d0a51c"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_72f1a3a2d7d3ae30eedaf7f0e4"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_ff46020ca83c08b39d942f1c8d"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."student_subjects"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_820ef09f63e994942694ee2d79"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_24f98e457b1379cbca9d52c926"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_94ea28a151d5f49f6bd4833466"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_aa8edc7905ad764f8592456964"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."students"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_825aaedc40c4ae240b204fb22b"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_32447b0163c35b4eae18533104"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_36003574eb0dd51df1e8eb085d"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_1d18674afb00031593e736b79e"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."schools"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_c6b0d048e330af6d4fd91594ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_84aee9a3a25ab728a2c2f18023"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."school_subscriptions"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_2d2df70a81d37c893ef216caf8"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."subscription_plans"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_97264083451de63d64801751f2"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_cc1b0c538b7cb9aa972c5ba3da"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."subscription_plan_platform_feature_mappings"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_9e5d152d519f6a87d849226f37"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_7e13da35936d31f29c3f7d30a0"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_5b5228738b49e583eedc2edb47"`,
    );
    await queryRunner.query(`DROP TABLE "e_schooling"."platform_features"`);
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_29ad372ecd17d6c8f597dd8793"`,
    );
    await queryRunner.query(
      `DROP INDEX "e_schooling"."IDX_35dfa5e6546954af557d5f1cd1"`,
    );
    await queryRunner.query(
      `DROP TABLE "e_schooling"."subscription_plan_prices"`,
    );
  }
}
