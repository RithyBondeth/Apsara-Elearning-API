-- In-app notifications.
--
-- The platform already emits everything worth telling a learner about — a badge
-- crossing its XP threshold, a quiz graded, a course finished, a subscription
-- event — and none of it was ever surfaced. This is the table those land in.
--
-- `type` is text rather than a pg enum, matching `courses.required_entitlement`:
-- new notification kinds arrive with new features, and an enum would make each
-- one a migration.
--
-- `read_at` is a nullable timestamp rather than a boolean — knowing when a row
-- was read costs nothing, and a boolean cannot be recovered into a time later.
--
-- Constraint and index names match what drizzle generates from
-- schemas/user/notification.schema.ts, so a later `db:push` sees no drift.

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL,
  "type"       text NOT NULL,
  "title"      text NOT NULL,
  "body"       text,
  "data"       jsonb,
  "read_at"    timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "notifications"
  DROP CONSTRAINT IF EXISTS "notifications_user_id_users_id_fk";
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- The feed is always "this user's rows, newest first".
CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_index"
  ON "notifications" ("user_id", "created_at");
