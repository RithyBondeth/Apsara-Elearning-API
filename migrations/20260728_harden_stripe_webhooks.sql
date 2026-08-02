ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "provider_invoice_id" varchar(255),
ADD COLUMN IF NOT EXISTS "provider_payment_intent_id" varchar(255),
ADD COLUMN IF NOT EXISTS "provider_charge_id" varchar(255),
ADD COLUMN IF NOT EXISTS "refunded_amount" numeric(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "refund_status" varchar(32);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_invoice_id_unique"
ON "payments" ("provider_invoice_id")
WHERE "provider_invoice_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_payment_intent_id_unique"
ON "payments" ("provider_payment_intent_id")
WHERE "provider_payment_intent_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_charge_id_unique"
ON "payments" ("provider_charge_id")
WHERE "provider_charge_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "payment_refunds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payment_id" uuid NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
  "provider_refund_id" varchar(255) NOT NULL UNIQUE,
  "amount" numeric(10, 2) NOT NULL,
  "currency" varchar(3) NOT NULL,
  "status" varchar(32) NOT NULL,
  "reason" varchar(64),
  "failure_reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "stripe_webhook_events"
ADD COLUMN IF NOT EXISTS "status" varchar(32) NOT NULL DEFAULT 'processed',
ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "last_error" text,
ADD COLUMN IF NOT EXISTS "received_at" timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE "stripe_webhook_events"
ALTER COLUMN "processed_at" DROP NOT NULL,
ALTER COLUMN "processed_at" DROP DEFAULT;
