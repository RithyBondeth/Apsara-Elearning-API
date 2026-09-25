-- Admin-curated reviews for the landing page.
--
-- Written reviews are user text, so none reaches the public homepage until an
-- admin features it. Editing a featured review clears the flag again (see
-- RatingService.upsert) — approval covers the text that was read, not whatever
-- the learner writes later.

ALTER TABLE "course_ratings"
  ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
