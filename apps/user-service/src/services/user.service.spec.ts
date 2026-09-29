import { UserService } from './user.service';
import type { NotificationService } from './notification.service';

/** Leaderboard reads never raise notifications; a stub satisfies the ctor. */
const notifications = {
  create: jest.fn(),
} as unknown as NotificationService;

/**
 * Leaderboard assembly. The ranking itself is a SQL window function, so what is
 * pinned here is the code around it: the privacy-preserving display name, the
 * viewer row (on-page vs. looked up separately), and the admin exclusion.
 */

/** Ordered Drizzle stand-in: the Nth select resolves to the Nth queued rows. */
function fakeDb(selects: unknown[][]) {
  let si = 0;
  const db = {
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'orderBy', 'limit']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
  };
  return { db, selectCount: () => si };
}

const row = (over: Record<string, unknown> = {}) => ({
  rank: 1,
  userId: 'u1',
  firstName: 'Sok',
  lastName: 'Dara',
  avatar: 'rocket',
  xp: 2450,
  streak: 7,
  ...over,
});

describe('UserService.leaderboard', () => {
  it('ranks the page and marks the viewer', async () => {
    const ranked = [
      row({ rank: 1, userId: 'u1', xp: 2450 }),
      row({ rank: 2, userId: 'u2', firstName: 'Chan', lastName: 'Bopha', xp: 900 }),
    ];
    const { db } = fakeDb([ranked, [{ total: 2 }]]);
    const service = new UserService(db as never, notifications);

    const board = await service.leaderboard('u2', 20);

    expect(board.total).toBe(2);
    expect(board.entries).toHaveLength(2);
    expect(board.entries[0]).toMatchObject({ rank: 1, xp: 2450, isViewer: false });
    expect(board.entries[1]).toMatchObject({ rank: 2, isViewer: true });
  });

  it('shows a first name plus last initial, never a full surname or email', async () => {
    const { db } = fakeDb([[row()], [{ total: 1 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);

    expect(board.entries[0].displayName).toBe('Sok D.');
    expect(JSON.stringify(board.entries[0])).not.toContain('Dara');
    expect(board.entries[0]).not.toHaveProperty('email');
  });

  it('falls back to a generic name when the learner has no name set', async () => {
    const { db } = fakeDb([
      [row({ firstName: null, lastName: null })],
      [{ total: 1 }],
    ]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);
    expect(board.entries[0].displayName).toBe('Learner');
  });

  it('uses the on-page row as "me" without a second lookup', async () => {
    const { db, selectCount } = fakeDb([[row({ userId: 'u1' })], [{ total: 1 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);

    expect(board.me).toMatchObject({ userId: 'u1', isViewer: true });
    // ranked page + count only — no extra standing query.
    expect(selectCount()).toBe(2);
  });

  it('looks up the viewer separately when they rank below the page', async () => {
    const page = [row({ userId: 'other', firstName: 'Chan', lastName: 'Bopha' })];
    const viewer = [
      {
        userId: 'u1',
        firstName: 'Sok',
        lastName: 'Dara',
        avatar: 'star',
        xp: 10,
        streak: 1,
        isAdmin: false,
      },
    ];
    // page, count, viewer row, count-ahead
    const { db } = fakeDb([page, [{ total: 50 }], viewer, [{ count: 41 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 1);

    expect(board.entries[0].isViewer).toBe(false);
    expect(board.me).toMatchObject({ userId: 'u1', rank: 42, xp: 10, isViewer: true });
  });

  it('returns a null "me" for an admin, who is not on the board', async () => {
    const page = [row({ userId: 'other' })];
    const admin = [{ userId: 'a1', firstName: 'Root', lastName: null, avatar: null, xp: 0, streak: 0, isAdmin: true }];
    const { db } = fakeDb([page, [{ total: 3 }], admin]);

    const board = await new UserService(db as never, notifications).leaderboard('a1', 20);
    expect(board.me).toBeNull();
  });

  it('returns a null "me" for a suspended learner, who is hidden from the board', async () => {
    const { db } = fakeDb([
      [row({ userId: 'u1' })],
      [{ total: 1 }],
      [{ userId: 'u9', xp: 50, streak: 0, isAdmin: false, suspendedAt: new Date() }],
    ]);
    const board = await new UserService(db as never, notifications).leaderboard('u9', 20);
    expect(board.me).toBeNull();
  });

  it('returns a null "me" when the account no longer exists', async () => {
    const { db } = fakeDb([[row({ userId: 'other' })], [{ total: 1 }], []]);
    const board = await new UserService(db as never, notifications).leaderboard('ghost', 20);
    expect(board.me).toBeNull();
  });

  it('treats missing xp/streak as zero', async () => {
    const { db } = fakeDb([[row({ xp: null, streak: null })], [{ total: 1 }]]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);
    expect(board.entries[0]).toMatchObject({ xp: 0, streak: 0 });
  });

  it('reports an empty board rather than failing', async () => {
    const { db } = fakeDb([[], [{ total: 0 }], []]);
    const board = await new UserService(db as never, notifications).leaderboard('u1', 20);
    expect(board.entries).toEqual([]);
    expect(board.total).toBe(0);
  });
});

/**
 * Admin account management. The guards exist so the admin panel can never
 * lock every admin out: no self-demotion/suspension/deletion, and never
 * below one active admin.
 */
function writeDb(selects: unknown[][], returned: unknown[] = [{ id: 'u2' }]) {
  let si = 0;
  const set = jest.fn();
  const del = jest.fn();
  const db = {
    select: () => {
      const idx = si++;
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'orderBy', 'limit']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown, rej: (r: unknown) => unknown) =>
        Promise.resolve(selects[idx] ?? []).then(res, rej);
      return node;
    },
    update: () => ({
      set: (v: unknown) => {
        set(v);
        return { where: () => ({ returning: () => Promise.resolve(returned) }) };
      },
    }),
    delete: () => {
      del();
      return { where: () => ({ returning: () => Promise.resolve(returned) }) };
    },
  };
  return { db, set, del };
}

const BAD_REQUEST = { error: { statusCode: 400 } };
const student = { id: 'u2', isAdmin: false, suspendedAt: null };
const admin = (id: string, suspendedAt: Date | null = null) => ({ id, isAdmin: true, suspendedAt });

describe('UserService.adminUpdate', () => {
  it('throws 404 for an unknown user', async () => {
    const { db } = writeDb([[]]);
    await expect(
      new UserService(db as never, notifications).adminUpdate('x', 'me', { isAdmin: true }),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });

  it('promotes a learner to admin', async () => {
    const { db, set } = writeDb([[student]]);
    await new UserService(db as never, notifications).adminUpdate('u2', 'me', { isAdmin: true });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }));
  });

  it('refuses to let an admin demote or suspend themselves', async () => {
    const service = () => new UserService(writeDb([[admin('me')]]).db as never, notifications);
    await expect(service().adminUpdate('me', 'me', { isAdmin: false })).rejects.toMatchObject(BAD_REQUEST);
    await expect(service().adminUpdate('me', 'me', { suspended: true })).rejects.toMatchObject(BAD_REQUEST);
  });

  it('still lets an admin rename themselves', async () => {
    const { db, set } = writeDb([[admin('me')]]);
    await new UserService(db as never, notifications).adminUpdate('me', 'me', { firstName: '  Dara ' });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Dara' }));
  });

  it('refuses to demote the last active admin', async () => {
    // Target lookup → active-admin list (only the target; the other is suspended).
    const { db, set } = writeDb([[admin('a1')], [admin('a1')]]);
    await expect(
      new UserService(db as never, notifications).adminUpdate('a1', 'me', { isAdmin: false }),
    ).rejects.toMatchObject(BAD_REQUEST);
    expect(set).not.toHaveBeenCalled();
  });

  it('demotes an admin while another active admin remains', async () => {
    const { db, set } = writeDb([[admin('a1')], [admin('a1'), admin('me')]]);
    await new UserService(db as never, notifications).adminUpdate('a1', 'me', { isAdmin: false });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: false }));
  });

  it('suspending stamps suspendedAt and revokes the refresh token', async () => {
    const { db, set } = writeDb([[student]]);
    await new UserService(db as never, notifications).adminUpdate('u2', 'me', { suspended: true });
    const changes = set.mock.calls[0][0];
    expect(changes.suspendedAt).toBeInstanceOf(Date);
    expect(changes).toMatchObject({ refreshToken: null, refreshTokenExpiresAt: null });
  });

  it('re-suspending keeps the original suspension time', async () => {
    const since = new Date('2026-09-01T00:00:00Z');
    const { db, set } = writeDb([[{ ...student, suspendedAt: since }]]);
    await new UserService(db as never, notifications).adminUpdate('u2', 'me', { suspended: true });
    expect(set.mock.calls[0][0]).not.toHaveProperty('suspendedAt');
  });

  it('reinstating clears suspendedAt', async () => {
    const { db, set } = writeDb([[{ ...student, suspendedAt: new Date() }]]);
    await new UserService(db as never, notifications).adminUpdate('u2', 'me', { suspended: false });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ suspendedAt: null }));
  });

  it('stores a blank name as null', async () => {
    const { db, set } = writeDb([[student]]);
    await new UserService(db as never, notifications).adminUpdate('u2', 'me', { lastName: '   ' });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ lastName: null }));
  });
});

describe('UserService.remove', () => {
  it('refuses to let an admin delete their own account', async () => {
    const { db, del } = writeDb([[admin('me')], [admin('me'), admin('a2')]]);
    await expect(new UserService(db as never, notifications).remove('me', 'me')).rejects.toMatchObject(BAD_REQUEST);
    expect(del).not.toHaveBeenCalled();
  });

  it('refuses to delete the last active admin', async () => {
    const { db, del } = writeDb([[admin('a1')], [admin('a1')]]);
    await expect(new UserService(db as never, notifications).remove('a1', 'me')).rejects.toMatchObject(BAD_REQUEST);
    expect(del).not.toHaveBeenCalled();
  });

  it('deletes a learner', async () => {
    const { db, del } = writeDb([[student]]);
    const res = await new UserService(db as never, notifications).remove('u2', 'me');
    expect(res.id).toBe('u2');
    expect(del).toHaveBeenCalled();
  });

  it('throws 404 for an unknown user', async () => {
    const { db } = writeDb([[]]);
    await expect(new UserService(db as never, notifications).remove('x', 'me')).rejects.toMatchObject({
      error: { statusCode: 404 },
    });
  });
});
