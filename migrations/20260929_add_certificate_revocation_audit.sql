-- Who revoked a certificate, and why.
--
-- `revoked_at` already exists (public verification reports a revoked
-- certificate as invalid); this adds the audit trail an admin needs when
-- withdrawing one. The reason is shown to the learner and to admins, never on
-- the public verification page. `revoked_by` survives the admin's account
-- being deleted as NULL rather than blocking it.

ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "revocation_reason" text;

ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "revoked_by" uuid;

ALTER TABLE "certificates"
  DROP CONSTRAINT IF EXISTS "certificates_revoked_by_users_id_fk";
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_revoked_by_users_id_fk"
  FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL;
