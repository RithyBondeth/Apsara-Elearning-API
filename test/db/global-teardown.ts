import postgres from 'postgres';

/** Drops the run's throwaway database, even if connections were left open. */
export default async function globalTeardown(): Promise<void> {
  const server = process.env.TEST_DATABASE_URL;
  const name = process.env.INT_DATABASE_NAME;
  if (!server || !name) return;
  const admin = postgres(server, { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  } finally {
    await admin.end({ timeout: 1 });
  }
}
