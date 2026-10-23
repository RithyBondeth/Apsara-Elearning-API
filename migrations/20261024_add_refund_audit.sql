-- Refunds issued from the admin console record who asked and why.
-- Refunds made directly in the Stripe dashboard keep both null.

ALTER TABLE "payment_refunds"
  ADD COLUMN IF NOT EXISTS "requested_by" uuid,
  ADD COLUMN IF NOT EXISTS "note" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_refunds_requested_by_users_id_fk'
  ) THEN
    ALTER TABLE "payment_refunds"
      ADD CONSTRAINT "payment_refunds_requested_by_users_id_fk"
      FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;
