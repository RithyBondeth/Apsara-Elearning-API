// Shared by apply-migrations, baseline-migrations and setup-db.
//
// How the schema is built:
// - libs/database/src/schemas/** is the full, current schema. `db:push`
//   creates a database from it in one step.
// - migrations/*.sql are the incremental changes applied to databases that
//   already exist. Each one's effect is also reflected in the schema files, so
//   a freshly pushed database already contains everything they would do.
// - apsara_migrations.applied_migrations records which migrations a database
//   has, with a checksum so an edited migration is caught.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const migrationsDir = join(root, 'migrations');

// Migrations whose order is not their filename order; everything else runs
// sorted by name after these.
const EXPLICIT_ORDER = [
  '20260728_add_course_entitlements.sql',
  '20260728_add_stripe_billing.sql',
  '20260728_harden_stripe_webhooks.sql',
  '20260728_add_named_entitlements.sql',
];

/** Every migration file in run order, with its content and checksum. */
export async function listMigrations() {
  const discovered = (await readdir(migrationsDir)).filter((name) =>
    name.endsWith('.sql'),
  );
  const names = [
    ...EXPLICIT_ORDER.filter((name) => discovered.includes(name)),
    ...discovered.filter((name) => !EXPLICIT_ORDER.includes(name)).sort(),
  ];
  return Promise.all(
    names.map(async (name) => {
      const content = await readFile(join(migrationsDir, name), 'utf8');
      const checksum = createHash('sha256').update(content).digest('hex');
      return { name, content, checksum };
    }),
  );
}

export async function ensureTrackingTable(sql) {
  await sql`CREATE SCHEMA IF NOT EXISTS apsara_migrations`;
  await sql`CREATE TABLE IF NOT EXISTS apsara_migrations.applied_migrations (
    name text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;
}

/**
 * Whether the base schema exists. Migrations only alter an existing schema —
 * run against an empty database, the first ALTER fails on a missing table.
 */
export async function hasBaseSchema(sql) {
  const [row] = await sql`SELECT to_regclass('public.users') IS NOT NULL AS present`;
  return row.present;
}

export const FRESH_DATABASE_HINT =
  'This database has no schema yet. Migrations only change an existing schema.\n' +
  '  For a new database run:  npm run db:setup\n' +
  '  (creates the schema from libs/database/src/schemas and records every migration as applied)';

/**
 * Records every migration as applied without running it. Only correct for a
 * database whose schema came from `db:push`, which already contains every
 * migration's effect. Returns how many records were added.
 */
export async function recordAllAsApplied(sql) {
  await ensureTrackingTable(sql);
  let added = 0;
  for (const { name, checksum } of await listMigrations()) {
    const [existing] = await sql`
      SELECT 1 FROM apsara_migrations.applied_migrations WHERE name = ${name}`;
    if (existing) {
      console.log(`  - ${name} already recorded`);
      continue;
    }
    await sql`
      INSERT INTO apsara_migrations.applied_migrations (name, checksum)
      VALUES (${name}, ${checksum})`;
    console.log(`  ✓ marked ${name} as applied`);
    added += 1;
  }
  return added;
}
