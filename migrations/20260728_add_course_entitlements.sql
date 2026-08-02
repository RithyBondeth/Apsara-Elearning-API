ALTER TABLE "courses"
ADD COLUMN IF NOT EXISTS "requires_subscription" boolean NOT NULL DEFAULT false;
