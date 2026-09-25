// Marks every migration in migrations/ as applied without running it.
//
// Use once on a database whose schema was created with `npm run db:push`: the
// pushed schema already contains every migration's effect, so running them
// would fail or duplicate work. `npm run db:setup` does push + baseline for a
// new database in one step — prefer that.
import 'dotenv/config';
import postgres from 'postgres';
import {
  FRESH_DATABASE_HINT,
  hasBaseSchema,
  recordAllAsApplied,
} from './lib/migrations.mjs';

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function main() {
  if (!(await hasBaseSchema(sql))) throw new Error(FRESH_DATABASE_HINT);
  const added = await recordAllAsApplied(sql);
  console.log(`\nBaseline complete (${added} new record(s)).`);
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error('Baseline failed:', err.message);
    await sql.end({ timeout: 1 });
    process.exitCode = 1;
  });
