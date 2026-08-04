-- Course completion certificates.
--
-- `certificates` was already a sellable entitlement and was advertised on the
-- landing page, in the Terms and in the FAQ, with nothing behind it. This is
-- the table that makes it real.
--
-- `code` is the public verification handle printed on the certificate, so it is
-- unique and indexed for lookup by anyone (an employer checking an applicant).
-- One certificate per learner per course.

CREATE TABLE IF NOT EXISTS "certificates" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "course_id"  uuid NOT NULL REFERENCES "courses" ("id") ON DELETE CASCADE,
  "code"       text NOT NULL,
  "issued_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Names match drizzle's own convention so a later `db:push` sees no drift.
ALTER TABLE "certificates"
  DROP CONSTRAINT IF EXISTS "certificates_code_unique";
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_code_unique" UNIQUE ("code");

ALTER TABLE "certificates"
  DROP CONSTRAINT IF EXISTS "certificates_user_id_course_id_unique";
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_user_id_course_id_unique"
  UNIQUE ("user_id", "course_id");

CREATE INDEX IF NOT EXISTS "certificates_user_id_idx"
  ON "certificates" ("user_id");
