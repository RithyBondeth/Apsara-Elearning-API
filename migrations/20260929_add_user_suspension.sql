-- Admin-suspended accounts.
--
-- A suspended user can't log in or refresh a session (auth-service rejects
-- both), and suspending revokes their stored refresh token, so an open session
-- ends when its current access token expires. Null = active. Kept as a
-- timestamp rather than a boolean so admins can see when it happened.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "suspended_at" timestamp with time zone;
