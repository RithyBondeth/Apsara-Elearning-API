// Proves this branch's migrations upgrade a database to exactly the schema
// this branch declares.
//
// Two databases are built and compared:
//   upgraded — created by the BASE branch's `db:setup` (what production looks
//              like), then this branch's `db:migrate` applied on top;
//   fresh    — created by this branch's `db:setup` from
//              libs/database/src/schemas.
// Any difference means a migration and the schema files disagree: a column,
// constraint or index that one path creates and the other doesn't (e.g. an
// index added in SQL but not declared in the schema, which `db:setup` would
// silently skip and `db:push` would drop). An edited, already-merged
// migration also fails here, on its checksum.
//
//   TEST_DATABASE_URL=postgres://user:pass@host:5432/postgres \
//     npm run db:check-migrations -- --base origin/main
//
// TEST_DATABASE_URL must be able to CREATE/DROP DATABASE; nothing else on
// that server is touched.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import postgres from 'postgres';
import { root } from './lib/migrations.mjs';
import { describeSchema, diffDescriptions } from './lib/describe-schema.mjs';

const serverUrl = process.env.TEST_DATABASE_URL;
if (!serverUrl) {
  console.error(
    'TEST_DATABASE_URL is required: a Postgres URL allowed to create and drop databases.',
  );
  process.exit(2);
}
const flag = process.argv.indexOf('--base');
const baseRef = flag > -1 ? process.argv[flag + 1] : 'origin/main';

function databaseUrl(name) {
  const url = new URL(serverUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

function run(command, args, { cwd = root, env = {} } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with ${result.status}`,
    );
  }
}

async function describe(url) {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    return await describeSchema(sql);
  } finally {
    await sql.end({ timeout: 1 });
  }
}

async function main() {
  const suffix = `${process.pid}_${Date.now()}`;
  const upgraded = `apsara_check_upgraded_${suffix}`;
  const fresh = `apsara_check_fresh_${suffix}`;
  const baseDir = mkdtempSync(join(tmpdir(), 'apsara-base-'));
  const admin = postgres(serverUrl, { max: 1, onnotice: () => {} });

  try {
    console.log(`▶ Checking out base ${baseRef}…`);
    run('git', ['worktree', 'add', '--detach', '--quiet', baseDir, baseRef]);
    symlinkSync(join(root, 'node_modules'), join(baseDir, 'node_modules'));

    await admin.unsafe(`CREATE DATABASE "${upgraded}"`);
    await admin.unsafe(`CREATE DATABASE "${fresh}"`);

    console.log(`\n▶ Building the base schema (${baseRef})…`);
    run('node', ['scripts/setup-db.mjs'], {
      cwd: baseDir,
      env: { DATABASE_URL: databaseUrl(upgraded) },
    });
    console.log('\n▶ Applying this branch’s migrations on top…');
    run('node', ['scripts/apply-migrations.mjs'], {
      env: { DATABASE_URL: databaseUrl(upgraded) },
    });
    console.log('\n▶ Building this branch’s schema from scratch…');
    run('node', ['scripts/setup-db.mjs'], {
      env: { DATABASE_URL: databaseUrl(fresh) },
    });

    const { onlyInA, onlyInB } = diffDescriptions(
      await describe(databaseUrl(upgraded)),
      await describe(databaseUrl(fresh)),
    );
    if (!onlyInA.length && !onlyInB.length) {
      console.log(
        '\n✓ Migrations upgrade the base schema to exactly this branch’s schema.',
      );
      return;
    }

    console.error('\n✗ Migrated and freshly built schemas differ.\n');
    if (onlyInA.length) {
      console.error(
        '  Only after migrating (a migration creates it, the schema files don’t declare it):',
      );
      onlyInA.forEach((line) => console.error(`    + ${line}`));
    }
    if (onlyInB.length) {
      console.error(
        '  Only in a fresh setup (declared in the schema files, no migration creates it):',
      );
      onlyInB.forEach((line) => console.error(`    - ${line}`));
    }
    process.exitCode = 1;
  } finally {
    for (const name of [upgraded, fresh]) {
      await admin
        .unsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
        .catch(() => undefined);
    }
    await admin.end({ timeout: 1 });
    spawnSync('git', ['worktree', 'remove', '--force', baseDir], { cwd: root });
    rmSync(baseDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`\nMigration check failed: ${error.message}`);
  process.exitCode = 1;
});
