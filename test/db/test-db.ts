import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { user } from '@app/database/schemas/user/user.schema';
import { courses } from '@app/database/schemas/course/course.schema';
import { plans } from '@app/database/schemas/subscription/plan.schema';

/**
 * Shared by the `*.int-spec.ts` suites. Each suite opens its own connection to
 * the run's database (created by global-setup) and starts from empty tables,
 * so suites never see each other's rows — several of the rules under test
 * ("the last active admin", leaderboard totals) count across the whole table.
 */
export function openTestDb() {
  const url = process.env.INT_DATABASE_URL;
  if (!url) {
    throw new Error('Run integration tests with `npm run test:int`.');
  }
  const sql = postgres(url, { max: 4, onnotice: () => {} });
  const db: PostgresJsDatabase<Record<string, never>> = drizzle(sql);
  return { sql, db };
}

/** Empties every table in `public`; the schema itself is left as built. */
export async function resetDb(sql: postgres.Sql): Promise<void> {
  const tables = await sql<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  if (!tables.length) return;
  await sql.unsafe(
    `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
}

let sequence = 0;
const next = () => ++sequence;

export async function createUser(
  db: PostgresJsDatabase<Record<string, never>>,
  over: Partial<typeof user.$inferInsert> = {},
) {
  const n = next();
  const [row] = await db
    .insert(user)
    .values({
      email: `user${n}@int.test`,
      password: 'not-a-real-hash',
      firstName: `User${n}`,
      isEmailVerified: true,
      ...over,
    })
    .returning();
  return row;
}

export async function createCourse(
  db: PostgresJsDatabase<Record<string, never>>,
  over: Partial<typeof courses.$inferInsert> = {},
) {
  const n = next();
  const [row] = await db
    .insert(courses)
    .values({ title: `Course ${n}`, slug: `course-${n}`, ...over })
    .returning();
  return row;
}

export async function createPlan(
  db: PostgresJsDatabase<Record<string, never>>,
  over: Partial<typeof plans.$inferInsert> = {},
) {
  const n = next();
  const [row] = await db
    .insert(plans)
    .values({ name: `Plan ${n}`, slug: `plan-${n}`, price: '5.00', ...over })
    .returning();
  return row;
}

export const days = (n: number) => new Date(Date.now() + n * 86_400_000);
