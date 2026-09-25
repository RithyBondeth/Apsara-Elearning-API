// One command for any local database, new or existing:
//
// - New (empty) database: create the full schema from
//   libs/database/src/schemas with drizzle-kit push, then record every
//   migration as applied — the pushed schema already includes them.
// - Existing database: apply any pending migrations (same as db:migrate).
//
// push only ever runs against an empty database, so it cannot drop data.
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import postgres from 'postgres';
import { hasBaseSchema, recordAllAsApplied, root } from './lib/migrations.mjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  let fresh;
  try {
    fresh = !(await hasBaseSchema(sql));
  } finally {
    await sql.end({ timeout: 1 });
  }

  if (!fresh) {
    console.log('▶ Existing database — applying pending migrations…');
    run('node', ['scripts/apply-migrations.mjs']);
    return;
  }

  console.log('▶ New database — creating schema with drizzle-kit push…');
  run('npx', [
    'drizzle-kit',
    'push',
    '--config=libs/database/src/config/drizzle.config.ts',
    '--force',
  ]);

  console.log('▶ Recording migrations as applied (already in the pushed schema)…');
  const after = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const added = await recordAllAsApplied(after);
    console.log(`\nDatabase ready (${added} migration(s) recorded).`);
  } finally {
    await after.end({ timeout: 1 });
  }
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exitCode = 1;
});
