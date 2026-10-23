import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { createUser, openTestDb, resetDb } from '../db/test-db';

/**
 * `npm run seed:content` against a real database, run exactly as on a live
 * site (NODE_ENV=production): it must import the Grade 12 courses, create no
 * users, and on a rerun leave existing courses — and learners' rows in them —
 * untouched.
 */
const { sql, db } = openTestDb();
const root = join(__dirname, '..', '..');

function importContent(...args: string[]) {
  const run = spawnSync('node', ['scripts/seed-content.mjs', ...args], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: process.env.INT_DATABASE_URL,
    },
    encoding: 'utf8',
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

const count = async (table: string) =>
  Number((await sql.unsafe(`SELECT count(*)::int AS n FROM ${table}`))[0].n);

afterAll(() => sql.end({ timeout: 1 }));

describe('seed:content', () => {
  beforeAll(() => resetDb(sql));

  it('imports the four Grade 12 courses, published, with no users', async () => {
    const { status, output } = importContent();

    expect(status).toBe(0);
    expect(output).toContain('4 course(s) imported');
    const courses = await sql<{ slug: string; published: boolean }[]>`
      SELECT slug, published FROM courses ORDER BY slug`;
    expect(courses.map((c) => c.slug)).toEqual([
      'biology',
      'chemistry',
      'math',
      'math-basic',
    ]);
    expect(courses.every((c) => c.published)).toBe(true);
    expect(await count('lessons')).toBe(119);
    expect(await count('quiz_questions')).toBeGreaterThan(0);
    expect(await count('users')).toBe(0);
    expect(await count('grade_levels')).toBe(12);
  });

  it('leaves existing courses and learners’ rows alone on a rerun', async () => {
    const lessonsBefore = await count('lessons');
    await sql`UPDATE courses SET title = 'Edited by an admin' WHERE slug = 'math'`;
    const learner = await createUser(db);
    const [math] = await sql<{ id: string }[]>`
      SELECT id FROM courses WHERE slug = 'math'`;
    await sql`
      INSERT INTO enrollments (user_id, course_id) VALUES (${learner.id}, ${math.id})`;

    const { status, output } = importContent();

    expect(status).toBe(0);
    expect(output).toContain('0 course(s) imported, 4 already present');
    expect(await count('courses')).toBe(4);
    expect(await count('lessons')).toBe(lessonsBefore);
    const [after] = await sql<{ id: string; title: string }[]>`
      SELECT id, title FROM courses WHERE slug = 'math'`;
    expect(after).toEqual({ id: math.id, title: 'Edited by an admin' });
    expect(await count('enrollments')).toBe(1);
  });

  it('imports drafts with --draft', async () => {
    await resetDb(sql);

    const { status } = importContent('--draft');

    expect(status).toBe(0);
    const rows = await sql<{ published: boolean }[]>`
      SELECT published FROM courses`;
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => !r.published)).toBe(true);
  });
});
