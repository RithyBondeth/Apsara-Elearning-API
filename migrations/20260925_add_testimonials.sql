-- Testimonials from real teachers, beta testers and partners.
--
-- Entered by an admin with a record of consent: `consent_source` (how the
-- person agreed) and `consented_at` (when) are NOT NULL, so no quote can be
-- published without one. Unpublished by default.

CREATE TABLE IF NOT EXISTS "testimonials" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"           text NOT NULL,
  "role"           text NOT NULL,
  "role_km"        text,
  "quote"          text NOT NULL,
  "quote_km"       text,
  "avatar"         text,
  "consent_source" text NOT NULL,
  "consented_at"   date NOT NULL,
  "published"      boolean NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now()
);
