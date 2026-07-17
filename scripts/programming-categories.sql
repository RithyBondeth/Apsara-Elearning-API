-- Programming track: category taxonomy
--
-- One-off DDL matching libs/database/src/schemas/course/programming-category.schema.ts
-- and the `categoryId` / `programming` additions in course.schema.ts.
--
-- WHY THIS FILE INSTEAD OF drizzle/:
--   This repo builds its schema with `db:push`, and drizzle/ is stale — its
--   latest snapshot still describes the pre-K–12 model (it has `categories`
--   and lacks subjects/grade_levels/faculties/majors). Running `db:generate`
--   therefore asks interactively whether `subjects` is a rename of
--   `categories`, which fails without a TTY. Adding a 0002 migration on top of
--   that snapshot would bake the inconsistency in, so the additive DDL lives
--   here instead.
--
-- HOW TO APPLY — either:
--   psql "$DATABASE_URL" -f scripts/programming-categories.sql
--   -- or, equivalently, from an interactive terminal:
--   npm run db:push
--
-- Names below match drizzle's conventions exactly (verified against the live
-- `subjects` / `courses` tables), so a later `db:push` sees no drift.
--
-- Statements are additive and idempotent. Note: ALTER TYPE ... ADD VALUE must
-- not run inside a transaction block that also uses the new value, so run this
-- file as-is rather than wrapping it in BEGIN/COMMIT.

-- 1. Allow courses to sit on the programming track.
ALTER TYPE "program_type" ADD VALUE IF NOT EXISTS 'programming';

-- 2. The category taxonomy itself (flat, mirroring `subjects`).
CREATE TABLE IF NOT EXISTS "programming_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "name_km" text,
  "slug" text NOT NULL,
  "description" text,
  "description_km" text,
  "icon" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "programming_categories_slug_unique" UNIQUE("slug")
);

-- 3. Programming placement on courses.
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "category_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_category_id_programming_categories_id_fk'
  ) THEN
    ALTER TABLE "courses"
      ADD CONSTRAINT "courses_category_id_programming_categories_id_fk"
      FOREIGN KEY ("category_id")
      REFERENCES "programming_categories"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Starter categories for the programming track.
INSERT INTO "programming_categories" ("name", "name_km", "slug", "description", "description_km", "icon")
VALUES
  ('Web Development', 'ការអភិវឌ្ឍន៍គេហទំព័រ', 'web-development',
   'Build websites and web apps with HTML, CSS, JavaScript and React.',
   'បង្កើតគេហទំព័រ និងកម្មវិធីវេប ជាមួយ HTML, CSS, JavaScript និង React។', 'Globe'),
  ('Mobile App Development', 'ការអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទ', 'mobile-app-development',
   'Build Android and iOS apps with React Native and Flutter.',
   'បង្កើតកម្មវិធី Android និង iOS ជាមួយ React Native និង Flutter។', 'Smartphone'),
  ('Data Science & AI', 'វិទ្យាសាស្ត្រទិន្នន័យ & AI', 'data-science-ai',
   'Analyse data and build machine learning models with Python.',
   'វិភាគទិន្នន័យ និងបង្កើតគំរូ machine learning ជាមួយ Python។', 'Brain'),
  ('Game Development', 'ការអភិវឌ្ឍន៍ហ្គេម', 'game-development',
   'Create 2D and 3D games with Unity and Godot.',
   'បង្កើតហ្គេម 2D និង 3D ជាមួយ Unity និង Godot។', 'Gamepad2'),
  ('DevOps & Cloud', 'DevOps & ក្លោដ', 'devops-cloud',
   'Ship and scale applications with Docker, CI/CD and the cloud.',
   'ដាក់ឱ្យដំណើរការ និងពង្រីកកម្មវិធី ជាមួយ Docker, CI/CD និងក្លោដ។', 'Cloud'),
  ('Cybersecurity', 'សន្តិសុខសាយប័រ', 'cybersecurity',
   'Secure systems, networks and applications from attack.',
   'ការពារប្រព័ន្ធ បណ្តាញ និងកម្មវិធី ពីការវាយប្រហារ។', 'ShieldCheck')
ON CONFLICT ("slug") DO NOTHING;
