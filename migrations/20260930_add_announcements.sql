-- Admin announcements: one message delivered to many learners' notifications.
--
-- The notifications themselves land in "notifications" (type 'announcement');
-- this table is the sender's record — what was said, to whom, by whom, and how
-- many learners it reached. `sent_by` and `course_id` become NULL if that admin
-- or course is deleted, so the history survives.

CREATE TABLE IF NOT EXISTS "announcements" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"            text NOT NULL,
  "body"             text NOT NULL,
  "audience"         varchar(16) NOT NULL,
  "course_id"        uuid,
  "subscribers_only" boolean NOT NULL DEFAULT false,
  "recipient_count"  integer NOT NULL DEFAULT 0,
  "sent_by"          uuid,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "announcements"
  DROP CONSTRAINT IF EXISTS "announcements_course_id_courses_id_fk";
ALTER TABLE "announcements"
  ADD CONSTRAINT "announcements_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE SET NULL;

ALTER TABLE "announcements"
  DROP CONSTRAINT IF EXISTS "announcements_sent_by_users_id_fk";
ALTER TABLE "announcements"
  ADD CONSTRAINT "announcements_sent_by_users_id_fk"
  FOREIGN KEY ("sent_by") REFERENCES "users" ("id") ON DELETE SET NULL;
