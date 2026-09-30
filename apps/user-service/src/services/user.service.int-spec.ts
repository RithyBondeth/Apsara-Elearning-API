import { eq } from 'drizzle-orm';
import { user } from '@app/database/schemas/user/user.schema';
import {
  createUser,
  days,
  openTestDb,
  resetDb,
} from '../../../../test/db/test-db';
import { UserService } from './user.service';
import type { NotificationService } from './notification.service';

/**
 * Account-state rules that count across the whole users table — "the last
 * active admin", who is on the leaderboard and its totals — which only a
 * real database can answer.
 */
const { sql, db } = openTestDb();
const users = new UserService(
  db as never,
  {
    create: jest.fn(),
  } as unknown as NotificationService,
);
const BAD_REQUEST = { error: { statusCode: 400 } };

afterAll(() => sql.end({ timeout: 1 }));

describe('admin lockout guards', () => {
  let adminA: string;
  let adminB: string;
  let learner: string;

  beforeAll(async () => {
    await resetDb(sql);
    adminA = (await createUser(db, { isAdmin: true })).id;
    adminB = (await createUser(db, { isAdmin: true })).id;
    // A suspended admin must not count as the "other" admin.
    await createUser(db, { isAdmin: true, suspendedAt: days(-1) });
    learner = (await createUser(db)).id;
  });

  it('demotes an admin while another active admin remains', async () => {
    const res = await users.adminUpdate(adminB, adminA, { isAdmin: false });
    expect(res.isAdmin).toBe(false);
  });

  it('refuses to demote, suspend or delete the last active admin', async () => {
    await expect(
      users.adminUpdate(adminA, learner, { isAdmin: false }),
    ).rejects.toMatchObject(BAD_REQUEST);
    await expect(
      users.adminUpdate(adminA, learner, { suspended: true }),
    ).rejects.toMatchObject(BAD_REQUEST);
    await expect(users.remove(adminA, learner)).rejects.toMatchObject(
      BAD_REQUEST,
    );
  });

  it('refuses self-demotion and self-deletion', async () => {
    await expect(
      users.adminUpdate(adminA, adminA, { isAdmin: false }),
    ).rejects.toMatchObject(BAD_REQUEST);
    await expect(users.remove(adminA, adminA)).rejects.toMatchObject(
      BAD_REQUEST,
    );
  });

  it('suspending stamps the time and revokes the stored session', async () => {
    await db
      .update(user)
      .set({ refreshToken: 'x', refreshTokenExpiresAt: days(1) })
      .where(eq(user.id, learner));
    const res = await users.adminUpdate(learner, adminA, { suspended: true });
    expect(res.suspendedAt).toBeInstanceOf(Date);
    const [row] = await db
      .select({ token: user.refreshToken })
      .from(user)
      .where(eq(user.id, learner));
    expect(row.token).toBeNull();
  });
});

describe('leaderboard membership', () => {
  let active2: string;
  let suspended: string;
  let leaving: string;

  beforeAll(async () => {
    await resetDb(sql);
    await createUser(db, { isAdmin: true, firstName: 'Staff', xp: 9000 });
    await createUser(db, { firstName: 'Top', xp: 500 });
    suspended = (
      await createUser(db, {
        firstName: 'Banned',
        xp: 400,
        suspendedAt: days(-1),
      })
    ).id;
    leaving = (
      await createUser(db, {
        firstName: 'Leaving',
        xp: 300,
        deletionRequestedAt: days(-1),
      })
    ).id;
    active2 = (await createUser(db, { firstName: 'Next', xp: 100 })).id;
  });

  it('counts and ranks only active learners', async () => {
    const board = await users.leaderboard(active2, 100);
    expect(board.total).toBe(2);
    expect(board.entries.map((e) => e.displayName)).toEqual(['Top', 'Next']);
    expect(board.entries.map((e) => e.rank)).toEqual([1, 2]);
  });

  it('ranks a viewer off the page against active learners only', async () => {
    const board = await users.leaderboard(active2, 1);
    expect(board.entries.map((e) => e.displayName)).toEqual(['Top']);
    expect(board.me).toMatchObject({ rank: 2, isViewer: true });
  });

  it('gives suspended and deletion-pending viewers no row', async () => {
    expect((await users.leaderboard(suspended, 1)).me).toBeNull();
    expect((await users.leaderboard(leaving, 1)).me).toBeNull();
  });
});
