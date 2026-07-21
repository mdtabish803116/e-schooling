import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentProfileFields1784715600000 implements MigrationInterface {
  name = 'AddStudentProfileFields1784715600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Personal
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "blood_group" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "religion" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "category" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "nationality" varchar NULL DEFAULT 'Indian'`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "aadhaar_number" varchar NULL`);

    // Contact
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "mobile" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "alternate_mobile" varchar NULL`);

    // Address
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "village" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "district" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "state" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "pincode" varchar NULL`);

    // Father
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "father_name" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "father_occupation" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "father_mobile" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "father_email" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "father_aadhaar" varchar NULL`);

    // Mother
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "mother_name" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "mother_occupation" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "mother_mobile" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "mother_email" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "mother_aadhaar" varchar NULL`);

    // Guardian
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "guardian_name" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "guardian_relation" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "guardian_mobile" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "guardian_email" varchar NULL`);

    // Emergency
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "emergency_contact_name" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "emergency_contact_relation" varchar NULL`);

    // Medical
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "medical_condition" text NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "allergies" text NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "disability" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "doctor_name" varchar NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "doctor_phone" varchar NULL`);

    // Admission
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "admission_date" date NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "joining_date" date NULL`);
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "admission_type" varchar NULL`);

    // Documents as JSONB
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]'`);
    // Previous school as JSONB
    await queryRunner.query(`ALTER TABLE "e_schooling"."students" ADD COLUMN IF NOT EXISTS "previous_school" jsonb NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      'blood_group','religion','category','nationality','aadhaar_number',
      'mobile','alternate_mobile',
      'village','district','state','pincode',
      'father_name','father_occupation','father_mobile','father_email','father_aadhaar',
      'mother_name','mother_occupation','mother_mobile','mother_email','mother_aadhaar',
      'guardian_name','guardian_relation','guardian_mobile','guardian_email',
      'emergency_contact_name','emergency_contact_phone','emergency_contact_relation',
      'medical_condition','allergies','disability','doctor_name','doctor_phone',
      'admission_date','joining_date','admission_type',
      'previous_school',
    ];
    for (const col of cols) {
      await queryRunner.query(`ALTER TABLE "e_schooling"."students" DROP COLUMN IF EXISTS "${col}"`);
    }
  }
}
