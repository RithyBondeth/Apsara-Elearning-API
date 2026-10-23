-- AI tutor allowance lookups.
--
-- Before every tutor reply, ai-service sums the learner's tokens over a
-- trailing 30-day window. Without this index that is a scan of the whole
-- usage table, which grows by one row per reply.

CREATE INDEX IF NOT EXISTS "ai_usage_tracking_user_id_created_at_idx"
  ON "ai_usage_tracking" ("user_id", "created_at");
