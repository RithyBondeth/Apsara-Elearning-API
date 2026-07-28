ALTER TABLE "plans"
ADD COLUMN IF NOT EXISTS "stripe_price_id" varchar(255);

CREATE UNIQUE INDEX IF NOT EXISTS "plans_stripe_price_id_unique"
ON "plans" ("stripe_price_id")
WHERE "stripe_price_id" IS NOT NULL;

ALTER TABLE "subscriptions"
ADD COLUMN IF NOT EXISTS "provider" varchar(32) NOT NULL DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS "status" varchar(32) NOT NULL DEFAULT 'incomplete',
ADD COLUMN IF NOT EXISTS "provider_customer_id" varchar(255),
ADD COLUMN IF NOT EXISTS "provider_subscription_id" varchar(255),
ADD COLUMN IF NOT EXISTS "current_period_start" timestamptz,
ADD COLUMN IF NOT EXISTS "current_period_end" timestamptz,
ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_provider_subscription_id_unique"
ON "subscriptions" ("provider_subscription_id")
WHERE "provider_subscription_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_transaction_id_unique"
ON "payments" ("transaction_id")
WHERE "transaction_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "event_id" varchar(255) PRIMARY KEY,
  "event_type" varchar(255) NOT NULL,
  "livemode" boolean NOT NULL,
  "processed_at" timestamptz NOT NULL DEFAULT now()
);
