import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, 'migrations');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to apply migrations');
}

const sql = postgres(databaseUrl, { max: 1 });
const lockName = 'apsara-elearning-app-migrations';
const migrationOrder = [
  '20260728_add_course_entitlements.sql',
  '20260728_add_stripe_billing.sql',
  '20260728_harden_stripe_webhooks.sql',
  '20260728_add_named_entitlements.sql',
];

async function main() {
  await sql`SELECT pg_advisory_lock(hashtext(${lockName}))`;

  try {
    await sql`CREATE SCHEMA IF NOT EXISTS apsara_migrations`;
    await sql`CREATE TABLE IF NOT EXISTS apsara_migrations.applied_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`;

    const discovered = (await readdir(migrationsDir)).filter((name) =>
      name.endsWith('.sql'),
    );
    const unknown = discovered.filter((name) => !migrationOrder.includes(name));
    const migrationNames = [
      ...migrationOrder.filter((name) => discovered.includes(name)),
      ...unknown.sort(),
    ];

    let applied = 0;
    for (const name of migrationNames) {
      const content = await readFile(join(migrationsDir, name), 'utf8');
      const checksum = createHash('sha256').update(content).digest('hex');
      const [existing] = await sql`
        SELECT checksum
        FROM apsara_migrations.applied_migrations
        WHERE name = ${name}
        LIMIT 1`;

      if (existing) {
        if (existing.checksum !== checksum) {
          throw new Error(
            `Migration ${name} changed after it was applied. Create a new migration instead.`,
          );
        }
        console.log(`  - ${name} already applied`);
        continue;
      }

      try {
        await sql.unsafe(content);
      } catch (error) {
        // A migration may contain an explicit BEGIN. Ensure a failed batch does
        // not leave the single migration connection in an aborted transaction.
        await sql.unsafe('ROLLBACK').catch(() => undefined);
        throw error;
      }
      await sql`
        INSERT INTO apsara_migrations.applied_migrations (name, checksum)
        VALUES (${name}, ${checksum})`;
      console.log(`  + applied ${name}`);
      applied += 1;
    }

    console.log(`Migration check complete (${applied} applied).`);
  } finally {
    await sql`SELECT pg_advisory_unlock(hashtext(${lockName}))`;
  }
}

main()
  .then(() => sql.end())
  .catch(async (error) => {
    console.error('Migration failed:', error.message);
    await sql.end({ timeout: 1 });
    process.exitCode = 1;
  });
