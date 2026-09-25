-- Course ratings and written reviews.
--
-- The platform had no social proof of any kind: course cards showed no rating,
-- and the landing page's testimonials are hardcoded. This is the table real
-- ratings land in.
--
-- One row per learner per course, so rating again updates rather than stacks —
-- an average cannot be inflated by a single enthusiastic account.
--
-- `rating` is constrained to 1–5 in the database as well as the request DTO:
-- the RPC action is callable by any service, and an out-of-range value would
-- silently skew every average for that course.
--
-- Constraint and index names match what drizzle generates from
-- schemas/course/course-rating.schema.ts, so a later `db:push` sees no drift.

CREATE TABLE IF NOT EXISTS "course_ratings" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL,
  "course_id"  uuid NOT NULL,
  "rating"     integer NOT NULL,
  "review"     text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "course_ratings"
  DROP CONSTRAINT IF EXISTS "course_ratings_user_id_users_id_fk";
ALTER TABLE "course_ratings"
  ADD CONSTRAINT "course_ratings_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "course_ratings"
  DROP CONSTRAINT IF EXISTS "course_ratings_course_id_courses_id_fk";
ALTER TABLE "course_ratings"
  ADD CONSTRAINT "course_ratings_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE;

ALTER TABLE "course_ratings"
  DROP CONSTRAINT IF EXISTS "course_ratings_user_id_course_id_unique";
ALTER TABLE "course_ratings"
  ADD CONSTRAINT "course_ratings_user_id_course_id_unique"
  UNIQUE ("user_id", "course_id");

ALTER TABLE "course_ratings"
  DROP CONSTRAINT IF EXISTS "course_ratings_rating_range";
ALTER TABLE "course_ratings"
  ADD CONSTRAINT "course_ratings_rating_range"
  CHECK ("rating" >= 1 AND "rating" <= 5);

CREATE INDEX IF NOT EXISTS "course_ratings_course_id_index"
  ON "course_ratings" ("course_id");
