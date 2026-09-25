import 'dotenv/config';
import postgres from 'postgres';
import {
  FRESH_DATABASE_HINT,
  ensureTrackingTable,
  hasBaseSchema,
  listMigrations,
} from './lib/migrations.mjs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to apply migrations');
}

const sql = postgres(databaseUrl, { max: 1 });
const lockName = 'apsara-elearning-app-migrations';

async function main() {
  await sql`SELECT pg_advisory_lock(hashtext(${lockName}))`;

  try {
    if (!(await hasBaseSchema(sql))) {
      throw new Error(FRESH_DATABASE_HINT);
    }
    await ensureTrackingTable(sql);

    let applied = 0;
    for (const { name, content, checksum } of await listMigrations()) {
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
