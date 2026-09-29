-- Self-service account deletion with a 7-day grace period.
--
-- Requesting deletion stamps this column and signs the learner out everywhere.
-- Signing back in within the grace period clears it (the deletion is
-- cancelled); otherwise user-service's purge job deletes the account after
-- ACCOUNT_DELETION_GRACE_DAYS. Null = no deletion pending.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "deletion_requested_at" timestamp with time zone;

-- The purge job scans for due requests; keep that cheap as the table grows.
CREATE INDEX IF NOT EXISTS "users_deletion_requested_at_idx"
  ON "users" ("deletion_requested_at")
  WHERE "deletion_requested_at" IS NOT NULL;
