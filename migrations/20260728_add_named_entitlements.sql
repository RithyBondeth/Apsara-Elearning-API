BEGIN;

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_period_days integer NOT NULL DEFAULT 3;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_ends_at timestamptz;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS required_entitlement varchar(64);
UPDATE courses
SET required_entitlement = 'courses:premium'
WHERE requires_subscription = true AND required_entitlement IS NULL;

CREATE TABLE IF NOT EXISTS plan_entitlements (
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  entitlement varchar(64) NOT NULL CHECK (entitlement IN ('courses:premium', 'ai:tutor', 'certificates')),
  PRIMARY KEY (plan_id, entitlement)
);

CREATE TABLE IF NOT EXISTS user_entitlement_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement varchar(64) NOT NULL CHECK (entitlement IN ('courses:premium', 'ai:tutor', 'certificates')),
  effect varchar(16) NOT NULL DEFAULT 'allow' CHECK (effect IN ('allow', 'deny')),
  starts_at timestamptz,
  expires_at timestamptz,
  reason text NOT NULL,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_plan_entitlements_entitlement
  ON plan_entitlements (entitlement, plan_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlement_grants_resolve
  ON user_entitlement_grants (user_id, entitlement, effect)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_entitlement_window
  ON subscriptions (user_id, plan_id, status, expires_at)
  WHERE active = true;

-- Preserve the old paid-course behavior until administrators customize each plan.
INSERT INTO plan_entitlements (plan_id, entitlement)
SELECT id, capability
FROM plans
CROSS JOIN (VALUES ('courses:premium'), ('ai:tutor'), ('certificates')) AS defaults(capability)
ON CONFLICT DO NOTHING;

UPDATE subscriptions
SET status = 'active'
WHERE active = true
  AND status = 'incomplete'
  AND provider_subscription_id IS NULL;

COMMIT;
