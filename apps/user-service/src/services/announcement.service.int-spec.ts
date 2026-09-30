import { eq } from 'drizzle-orm';
import { announcements } from '@app/database/schemas/user/announcement.schema';
import { notifications } from '@app/database/schemas/user/notification.schema';
import { enrollments } from '@app/database/schemas/course/enrollment.schema';
import { subscriptions } from '@app/database/schemas/subscription/subscription.schema';
import { user } from '@app/database/schemas/user/user.schema';
import {
  createCourse,
  createPlan,
  createUser,
  days,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { AnnouncementService } from './announcement.service';

/**
 * Who an announcement reaches is decided entirely in SQL, and delivery is one
 * INSERT … SELECT in a transaction with the announcement row — both only
 * testable against a real database.
 */
const { sql, db } = openTestDb();
const service = new AnnouncementService(db as never);
afterAll(() => sql.end({ timeout: 1 }));

const ids: Record<string, string> = {};
let courseSlug: string;

beforeAll(async () => {
  await resetDb(sql);
  ids.admin = (
    await createUser(db, { isAdmin: true, firstName: 'Ada', lastName: 'Admin' })
  ).id;
  // Never reached, whatever the audience:
  await createUser(db, { suspendedAt: days(-1) });
  await createUser(db, { deletionRequestedAt: days(-1) });
  await createUser(db, { isEmailVerified: false });

  ids.enrolledPaying = (await createUser(db)).id;
  ids.enrolledTrial = (await createUser(db)).id;
  ids.enrolledLapsed = (await createUser(db)).id;
  ids.notEnrolled = (await createUser(db)).id;

  const course = await createCourse(db);
  ids.course = course.id;
  courseSlug = course.slug;
  for (const userId of [
    ids.enrolledPaying,
    ids.enrolledTrial,
    ids.enrolledLapsed,
  ]) {
    await db.insert(enrollments).values({ userId, courseId: course.id });
  }

  const plan = await createPlan(db);
  await db.insert(subscriptions).values([
    {
      userId: ids.enrolledPaying,
      planId: plan.id,
      status: 'active',
      active: true,
      expiresAt: days(30),
    },
    {
      userId: ids.enrolledTrial,
      planId: plan.id,
      status: 'trialing',
      active: true,
      trialEndsAt: days(3),
    },
    {
      userId: ids.enrolledLapsed,
      planId: plan.id,
      status: 'active',
      active: true,
      expiresAt: days(-1),
    },
  ]);
});

const count = async (audience: Parameters<AnnouncementService['preview']>[0]) =>
  (await service.preview(audience)).recipients;

describe('audience', () => {
  it('reaches every learner who can sign in, and no one else', async () => {
    expect(await count({ audience: 'all' })).toBe(4);
  });

  it("narrows to a course's enrolled learners", async () => {
    expect(await count({ audience: 'course', courseId: ids.course })).toBe(3);
  });

  it('narrows to active subscriptions (paid or trialing, not lapsed)', async () => {
    expect(await count({ audience: 'all', subscribersOnly: true })).toBe(2);
    expect(
      await count({
        audience: 'course',
        courseId: ids.course,
        subscribersOnly: true,
      }),
    ).toBe(2);
  });

  it('refuses an unknown course', async () => {
    await expect(
      count({
        audience: 'course',
        courseId: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });
});

describe('sending', () => {
  it('delivers one notification per recipient and records the count', async () => {
    const sent = await service.send(ids.admin, {
      audience: 'course',
      courseId: ids.course,
      title: '  Lesson 6 is live  ',
      body: 'Open the course to continue.',
    });

    expect(sent).toMatchObject({
      title: 'Lesson 6 is live',
      recipientCount: 3,
      sentByName: 'Ada Admin',
      audience: 'course',
    });
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.type, 'announcement'));
    expect(rows.map((r) => r.userId).sort()).toEqual(
      [ids.enrolledPaying, ids.enrolledTrial, ids.enrolledLapsed].sort(),
    );
    expect(rows[0]).toMatchObject({
      title: 'Lesson 6 is live',
      body: 'Open the course to continue.',
      readAt: null,
      data: { announcementId: sent.id, courseSlug },
    });
  });

  it('sends nothing — not even the record — when no learner matches', async () => {
    const before = (await db.select().from(announcements)).length;
    const empty = await createCourse(db);
    await expect(
      service.send(ids.admin, {
        audience: 'course',
        courseId: empty.id,
        title: 'Hello',
        body: 'Nobody is enrolled yet.',
      }),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
    expect((await db.select().from(announcements)).length).toBe(before);
  });

  it('keeps the history when the sender is deleted', async () => {
    const other = await createUser(db, { isAdmin: true });
    await service.send(other.id, {
      audience: 'all',
      title: 'Maintenance tonight',
      body: 'The site is down 22:00–23:00.',
    });
    await db.delete(user).where(eq(user.id, other.id));

    const history = await service.findAll();
    expect(history[0]).toMatchObject({
      title: 'Maintenance tonight',
      sentByName: null,
      recipientCount: 4,
    });
    expect(history[1]).toMatchObject({ title: 'Lesson 6 is live' });
  });
});
