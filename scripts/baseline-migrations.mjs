import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const drizzleDir = join(root, 'drizzle');
const sql = postgres(process.env.DATABASE_URL);

async function main() {
  const journal = JSON.parse(
    readFileSync(join(drizzleDir, 'meta', '_journal.json'), 'utf8'),
  );

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`;

  let added = 0;
  for (const entry of journal.entries) {
    const content = readFileSync(join(drizzleDir, `${entry.tag}.sql`), 'utf8');
    const hash = createHash('sha256').update(content).digest('hex');

    const [existing] = await sql`
      SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = ${hash} LIMIT 1`;
    if (existing) {
      console.log(`  • ${entry.tag} already recorded`);
      continue;
    }
    await sql`
      INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
      VALUES (${hash}, ${entry.when})`;
    console.log(`  ✓ marked ${entry.tag} as applied`);
    added++;
  }

  console.log(`\nBaseline complete (${added} new record(s)).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Baseline failed:', err.message);
    process.exit(1);
  });
