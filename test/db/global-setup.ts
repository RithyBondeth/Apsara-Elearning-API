import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import postgres from 'postgres';

/**
 * Creates a throwaway database for one `npm run test:int` run and builds the
 * current schema in it with the project's own `db:setup`, so the tests run
 * against exactly what a fresh deployment would have.
 *
 * TEST_DATABASE_URL points at any Postgres the tests may create and drop
 * databases on (in CI, the job's service container). Nothing else on that
 * server is touched.
 */
export default async function globalSetup(): Promise<void> {
  const server = process.env.TEST_DATABASE_URL;
  if (!server) {
    throw new Error(
      'TEST_DATABASE_URL is required for integration tests — a Postgres URL ' +
        'allowed to create and drop databases, e.g. ' +
        'postgres://postgres:postgres@localhost:5432/postgres',
    );
  }

  const name = `apsara_int_${process.pid}_${Date.now()}`;
  const admin = postgres(server, { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end({ timeout: 1 });
  }

  const url = new URL(server);
  url.pathname = `/${name}`;
  execFileSync('node', ['scripts/setup-db.mjs'], {
    cwd: join(__dirname, '..', '..'),
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'pipe',
  });

  // Tests run in-band (see jest-int.config.js), so they see this directly.
  process.env.INT_DATABASE_URL = url.toString();
  process.env.INT_DATABASE_NAME = name;
}
