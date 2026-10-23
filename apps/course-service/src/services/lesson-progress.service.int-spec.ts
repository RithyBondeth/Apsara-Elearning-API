import { Observable, of } from 'rxjs';
import type { CourseEntitlementService } from '@app/common';
import { modules } from '@app/database/schemas/course/module.schema';
import { lessons } from '@app/database/schemas/course/lessons/lesson.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import {
  createCourse,
  createUser,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { LessonProgressService } from './lesson-progress.service';
import type { CertificateService } from './certificate.service';

/**
 * Marking a lesson complete twice at once (a double-click) must award the
 * lesson's XP once — a read-then-write race only a real database exposes.
 */
const { sql, db } = openTestDb();
const userClient = {
  send: jest.fn<Observable<unknown>, [pattern: string, payload: unknown]>(() =>
    of({}),
  ),
};
const service = new LessonProgressService(
  db as never,
  userClient as never,
  {
    assertCanEnroll: jest.fn().mockResolvedValue(undefined),
  } as unknown as CourseEntitlementService,
  { issue: jest.fn() } as unknown as CertificateService,
);

afterAll(() => sql.end({ timeout: 1 }));

it('awards lesson XP once for simultaneous completions', async () => {
  await resetDb(sql);
  const learner = (await createUser(db)).id;
  const course = await createCourse(db, { published: true });
  const [mod] = await db
    .insert(modules)
    .values({ courseId: course.id, title: 'Module' })
    .returning();
  // Two lessons, so finishing one doesn't complete the course.
  const [lesson] = await db
    .insert(lessons)
    .values([
      { moduleId: mod.id, title: 'One', slug: 'one', order: 0 },
      { moduleId: mod.id, title: 'Two', slug: 'two', order: 1 },
    ])
    .returning();
  await db.insert(enrollments).values({ userId: learner, courseId: course.id });

  // Several at once, so the old read-then-write race shows up reliably.
  const results = await Promise.all(
    Array.from({ length: 4 }, () => service.markComplete(learner, lesson.id)),
  );

  expect(results.map((r) => r.xpAwarded).sort()).toEqual([0, 0, 0, 10]);
  const xpGrants = userClient.send.mock.calls.filter(
    ([pattern]) => pattern === 'user.add_xp',
  );
  expect(xpGrants).toHaveLength(1);
});
