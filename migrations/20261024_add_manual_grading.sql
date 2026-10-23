-- Manual grading of answers the auto-grader can't score (short answers
-- without an accepted-answer list).
--
-- An answer is waiting for a human while requires_review is true and
-- reviewed_at is null. pass_rewarded records that an attempt's pass has
-- already been considered for first-pass XP, so regrading can't award it
-- twice; attempts that already passed at submit are backfilled as handled.

ALTER TABLE "quiz_attempt_answers"
  ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "reviewed_by" uuid,
  ADD COLUMN IF NOT EXISTS "review_feedback" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_attempt_answers_reviewed_by_users_id_fk'
  ) THEN
    ALTER TABLE "quiz_attempt_answers"
      ADD CONSTRAINT "quiz_attempt_answers_reviewed_by_users_id_fk"
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "quiz_attempt_answers_pending_review_idx"
  ON "quiz_attempt_answers" ("created_at")
  WHERE "requires_review" AND "reviewed_at" IS NULL;

ALTER TABLE "quiz_attempts"
  ADD COLUMN IF NOT EXISTS "pass_rewarded" boolean NOT NULL DEFAULT false;

UPDATE "quiz_attempts"
  SET "pass_rewarded" = true
  WHERE "completed_at" IS NOT NULL AND "score" >= 70;
