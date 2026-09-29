-- Keep payment records when an account is deleted.
--
-- Payments used to cascade with their user, so deleting an account (by an
-- admin, or by the self-service purge after the grace period) erased the
-- platform's own record of money received. They are accounting records:
-- keep the row and unlink it instead. What remains — amount, currency, date,
-- status and Stripe references — no longer points at a person. Stripe keeps
-- the full history on its side regardless.

ALTER TABLE "payments"
  ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "payments"
  DROP CONSTRAINT IF EXISTS "payments_user_id_users_id_fk";
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
