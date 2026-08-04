-- Course completion certificates.
--
-- `certificates` was already a sellable entitlement and was advertised on the
-- landing page, in the Terms and in the FAQ, with nothing behind it. This is
-- the table that makes it real.
--
-- `code` is the public verification handle printed on the certificate, so it is
-- unique and indexed for lookup by anyone (an employer checking an applicant).
-- One certificate per learner per course.
--
-- Every constraint is named the way drizzle names it — FKs
-- <table>_<col>_<reftable>_<refcol>_fk, uniques <table>_<cols>_unique, and the
-- index matching schemas/course/certificate.schema.ts — so a later `db:push`
-- sees no drift against this DDL.

CREATE TABLE IF NOT EXISTS "certificates" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL,
  "course_id"  uuid NOT NULL,
  "code"       text NOT NULL,
  "issued_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "certificates"
  DROP CONSTRAINT IF EXISTS "certificates_user_id_users_id_fk";
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "certificates"
  DROP CONSTRAINT IF EXISTS "certificates_course_id_courses_id_fk";
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE;

ALTER TABLE "certificates"
  DROP CONSTRAINT IF EXISTS "certificates_code_unique";
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_code_unique" UNIQUE ("code");

ALTER TABLE "certificates"
  DROP CONSTRAINT IF EXISTS "certificates_user_id_course_id_unique";
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_user_id_course_id_unique"
  UNIQUE ("user_id", "course_id");

CREATE INDEX IF NOT EXISTS "certificates_user_id_index"
  ON "certificates" ("user_id");
