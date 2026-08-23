import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubjectAttendanceTables1786300000000
  implements MigrationInterface
{
  name = 'AddSubjectAttendanceTables1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------------------
    // 1. subject_attendance_sessions
    //    Maps to SubjectAttendanceSession entity.
    //    One session = one teacher taking subject attendance for a
    //    class/section on a given date & period.
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."subject_attendance_sessions" (
        "id"                   BIGSERIAL PRIMARY KEY,
        "school_id"            bigint       NOT NULL,
        "academic_session_id"  bigint,
        "class_id"             bigint       NOT NULL,
        "section_id"           bigint       NOT NULL,
        "subject_id"           bigint       NOT NULL,
        "teacher_id"           bigint,
        "timetable_slot_id"    bigint,
        "date"                 date         NOT NULL,
        "period_number"        integer      NOT NULL DEFAULT 1,
        "session_title"        character varying(255),
        "is_locked"            boolean      NOT NULL DEFAULT false,
        "locked_by"            character varying(150),
        "locked_at"            TIMESTAMP,
        "is_active"            boolean      NOT NULL DEFAULT true,
        "is_delete"            boolean      NOT NULL DEFAULT false,
        "created_by_id"        bigint,
        "updated_by_id"        bigint,
        "created_at"           TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP    NOT NULL DEFAULT now(),

        CONSTRAINT "fk_sas_class"
          FOREIGN KEY ("class_id")
          REFERENCES "e_schooling"."classes"("id"),

        CONSTRAINT "fk_sas_section"
          FOREIGN KEY ("section_id")
          REFERENCES "e_schooling"."sections"("id"),

        CONSTRAINT "fk_sas_subject"
          FOREIGN KEY ("subject_id")
          REFERENCES "e_schooling"."subjects"("id"),

        CONSTRAINT "fk_sas_teacher"
          FOREIGN KEY ("teacher_id")
          REFERENCES "e_schooling"."school_users"("id"),

        CONSTRAINT "fk_sas_timetable_slot"
          FOREIGN KEY ("timetable_slot_id")
          REFERENCES "e_schooling"."timetable_slots"("id")
      );
    `);

    // Indexes for subject_attendance_sessions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sas_school_id"
        ON "e_schooling"."subject_attendance_sessions" ("school_id");

      CREATE INDEX IF NOT EXISTS "idx_sas_academic_session_id"
        ON "e_schooling"."subject_attendance_sessions" ("academic_session_id");

      CREATE INDEX IF NOT EXISTS "idx_sas_class_id"
        ON "e_schooling"."subject_attendance_sessions" ("class_id");

      CREATE INDEX IF NOT EXISTS "idx_sas_section_id"
        ON "e_schooling"."subject_attendance_sessions" ("section_id");

      CREATE INDEX IF NOT EXISTS "idx_sas_subject_id"
        ON "e_schooling"."subject_attendance_sessions" ("subject_id");

      CREATE INDEX IF NOT EXISTS "idx_sas_teacher_id"
        ON "e_schooling"."subject_attendance_sessions" ("teacher_id");

      CREATE INDEX IF NOT EXISTS "idx_sas_timetable_slot_id"
        ON "e_schooling"."subject_attendance_sessions" ("timetable_slot_id");

      CREATE INDEX IF NOT EXISTS "idx_sas_date"
        ON "e_schooling"."subject_attendance_sessions" ("date");
    `);

    // ---------------------------------------------------------------
    // 2. subject_attendance_records
    //    Maps to SubjectAttendanceRecord entity.
    //    One record per student per session.
    // ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "e_schooling"."subject_attendance_records" (
        "id"                      BIGSERIAL PRIMARY KEY,
        "session_id"              bigint      NOT NULL,
        "student_enrollment_id"   bigint,
        "student_id"              bigint,
        "attendance_mark"         character varying(50)  NOT NULL DEFAULT 'present',
        "remarks"                 text,
        "created_by_id"           bigint,
        "updated_by_id"           bigint,
        "is_active"               boolean     NOT NULL DEFAULT true,
        "is_delete"               boolean     NOT NULL DEFAULT false,
        "created_at"              TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"              TIMESTAMP   NOT NULL DEFAULT now(),

        CONSTRAINT "fk_sar_session"
          FOREIGN KEY ("session_id")
          REFERENCES "e_schooling"."subject_attendance_sessions"("id")
          ON DELETE CASCADE,

        CONSTRAINT "fk_sar_student_enrollment"
          FOREIGN KEY ("student_enrollment_id")
          REFERENCES "e_schooling"."student_enrollments"("id"),

        CONSTRAINT "fk_sar_student"
          FOREIGN KEY ("student_id")
          REFERENCES "e_schooling"."students"("id")
      );
    `);

    // Indexes for subject_attendance_records
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sar_session_id"
        ON "e_schooling"."subject_attendance_records" ("session_id");

      CREATE INDEX IF NOT EXISTS "idx_sar_student_enrollment_id"
        ON "e_schooling"."subject_attendance_records" ("student_enrollment_id");

      CREATE INDEX IF NOT EXISTS "idx_sar_student_id"
        ON "e_schooling"."subject_attendance_records" ("student_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop records first (has FK to sessions)
    await queryRunner.query(`
      DROP TABLE IF EXISTS "e_schooling"."subject_attendance_records";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "e_schooling"."subject_attendance_sessions";
    `);
  }
}
