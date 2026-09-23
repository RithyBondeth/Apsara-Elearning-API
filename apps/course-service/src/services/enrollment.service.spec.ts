import type { CourseEntitlementService } from '@app/common';
import { EnrollmentService } from './enrollment.service';

/**
 * `continueLearning` is the "pick up where you left off" query. What matters is
 * that it resolves the *next* lesson in reading order, counts progress from
 * real completions, and stays at three queries no matter how many courses the
 * learner has enrolled in.
 */

/** Ordered Drizzle stand-in; `selectCount` pins the query budget. */
function fakeDb(selects: unknown[][]) {
  let si = 0;
  const db = {
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'innerJoin', 'leftJoin', 'where', 'orderBy', 'limit']) {
        node[m] = () => node;
      }
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
  };
  return { db, selectCount: () => si };
}

const entitlements = {} as unknown as CourseEntitlementService;

const service = (db: unknown) =>
  new EnrollmentService(db as never, entitlements);

const activeRow = (over: Record<string, unknown> = {}) => ({
  courseId: 'c1',
  progressPercent: 40,
  lastActivityAt: new Date('2026-09-20T10:00:00Z'),
  slug: 'intro-js',
  title: 'Intro to JavaScript',
  titleKm: 'សេចក្តីផ្តើម',
  thumbnail: null,
  ...over,
});

const lessonRow = (id: string, courseId = 'c1') => ({
  id,
  slug: `lesson-${id}`,
  title: `Lesson ${id}`,
  courseId,
  moduleTitle: 'Getting started',
});

describe('EnrollmentService.continueLearning', () => {
  it('returns no cards when nothing is in progress', async () => {
    const { db, selectCount } = fakeDb([[]]);
    await expect(service(db).continueLearning('u1', 3)).resolves.toEqual([]);
    // Short-circuits before the lesson/progress queries.
    expect(selectCount()).toBe(1);
  });

  it('points at the first lesson the learner has not completed', async () => {
    const lessons = [lessonRow('l1'), lessonRow('l2'), lessonRow('l3')];
    const done = [{ lessonId: 'l1' }];
    const { db } = fakeDb([[activeRow()], lessons, done]);

    const [card] = await service(db).continueLearning('u1', 3);

    expect(card.nextLesson).toMatchObject({ id: 'l2', slug: 'lesson-l2' });
    expect(card.completedLessons).toBe(1);
    expect(card.totalLessons).toBe(3);
  });

  it('starts at the first lesson when nothing is completed yet', async () => {
    const { db } = fakeDb([[activeRow()], [lessonRow('l1'), lessonRow('l2')], []]);
    const [card] = await service(db).continueLearning('u1', 3);
    expect(card.nextLesson?.id).toBe('l1');
    expect(card.completedLessons).toBe(0);
  });

  it('reports a null next lesson when every lesson is done', async () => {
    const lessons = [lessonRow('l1'), lessonRow('l2')];
    const { db } = fakeDb([
      [activeRow()],
      lessons,
      [{ lessonId: 'l1' }, { lessonId: 'l2' }],
    ]);
    const [card] = await service(db).continueLearning('u1', 3);
    expect(card.nextLesson).toBeNull();
    expect(card.completedLessons).toBe(2);
  });

  it('reports a null next lesson for a course with no lessons', async () => {
    const { db } = fakeDb([[activeRow()], [], []]);
    const [card] = await service(db).continueLearning('u1', 3);
    expect(card).toMatchObject({ nextLesson: null, totalLessons: 0 });
  });

  it('carries the course identity the resume link needs', async () => {
    const { db } = fakeDb([[activeRow()], [lessonRow('l1')], []]);
    const [card] = await service(db).continueLearning('u1', 3);

    expect(card).toMatchObject({
      courseId: 'c1',
      courseSlug: 'intro-js',
      courseTitle: 'Intro to JavaScript',
      progressPercent: 40,
    });
    expect(card.lastActivityAt).toEqual(new Date('2026-09-20T10:00:00Z'));
  });

  it('keeps each course to its own lessons and progress', async () => {
    const active = [
      activeRow({ courseId: 'c1', slug: 'a' }),
      activeRow({ courseId: 'c2', slug: 'b' }),
    ];
    const lessons = [
      lessonRow('a1', 'c1'),
      lessonRow('a2', 'c1'),
      lessonRow('b1', 'c2'),
    ];
    const { db } = fakeDb([active, lessons, [{ lessonId: 'a1' }]]);

    const cards = await service(db).continueLearning('u1', 3);

    expect(cards[0]).toMatchObject({ courseSlug: 'a', totalLessons: 2 });
    expect(cards[0].nextLesson?.id).toBe('a2');
    expect(cards[1]).toMatchObject({ courseSlug: 'b', totalLessons: 1 });
    expect(cards[1].nextLesson?.id).toBe('b1');
    expect(cards[1].completedLessons).toBe(0);
  });

  it('uses three queries however many courses are in progress', async () => {
    const active = Array.from({ length: 10 }, (_, i) =>
      activeRow({ courseId: `c${i}`, slug: `course-${i}` }),
    );
    const lessons = active.map((row, i) => lessonRow(`l${i}`, row.courseId));
    const { db, selectCount } = fakeDb([active, lessons, []]);

    const cards = await service(db).continueLearning('u1', 10);

    expect(cards).toHaveLength(10);
    // The client previously needed two requests per course.
    expect(selectCount()).toBe(3);
  });

  it('treats a missing progressPercent as zero', async () => {
    const { db } = fakeDb([
      [activeRow({ progressPercent: null })],
      [lessonRow('l1')],
      [],
    ]);
    const [card] = await service(db).continueLearning('u1', 3);
    expect(card.progressPercent).toBe(0);
  });
});
