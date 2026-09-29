import { of, throwError } from 'rxjs';
import { AccountPurgeService } from './account-purge.service';

/**
 * The purge deletes only accounts whose grace period has run out, only after
 * renewals are confirmed stopped, and never twice at once.
 */

/** `due` feeds the scan; `deletes` queues each delete's returning rows
 *  (default: the row was deleted). */
function fakeDb(due: { id: string }[], deletes: unknown[][] = []) {
  let deleteCalls = 0;
  const db = {
    select: () => {
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'limit']) node[m] = () => node;
      node.then = (
        res: (v: unknown) => unknown,
        rej: (r: unknown) => unknown,
      ) => Promise.resolve(due).then(res, rej);
      return node;
    },
    delete: () => ({
      where: () => ({
        returning: () =>
          Promise.resolve(deletes[deleteCalls++] ?? [{ id: 'deleted' }]),
      }),
    }),
  };
  return { db, deleteCalls: () => deleteCalls };
}

const client = (fail: string[] = []) => ({
  send: jest.fn((_: unknown, payload: { userId: string }) =>
    fail.includes(payload.userId)
      ? throwError(() => new Error('subscription-service down'))
      : of({ stopped: 0 }),
  ),
});

describe('AccountPurgeService.purgeDue', () => {
  it('stops renewals then deletes each due account', async () => {
    const { db, deleteCalls } = fakeDb([{ id: 'a' }, { id: 'b' }]);
    const subs = client();
    const service = new AccountPurgeService(db as never, subs as never);

    await expect(service.purgeDue()).resolves.toEqual({
      purged: 2,
      skipped: 0,
    });
    expect(subs.send).toHaveBeenCalledTimes(2);
    expect(deleteCalls()).toBe(2);
  });

  it("skips an account whose renewals couldn't be confirmed stopped", async () => {
    const { db, deleteCalls } = fakeDb([{ id: 'a' }, { id: 'b' }]);
    const service = new AccountPurgeService(
      db as never,
      client(['a']) as never,
    );

    await expect(service.purgeDue()).resolves.toEqual({
      purged: 1,
      skipped: 1,
    });
    expect(deleteCalls()).toBe(1); // only 'b' reached the delete
  });

  it("doesn't count an account whose request was cancelled at the last moment", async () => {
    // The delete re-checks the request is still due; a sign-in cleared it.
    const { db } = fakeDb([{ id: 'a' }], [[]]);
    const service = new AccountPurgeService(db as never, client() as never);
    await expect(service.purgeDue()).resolves.toEqual({
      purged: 0,
      skipped: 0,
    });
  });

  it('does nothing when no request is due', async () => {
    const { db } = fakeDb([]);
    const subs = client();
    const service = new AccountPurgeService(db as never, subs as never);
    await expect(service.purgeDue()).resolves.toEqual({
      purged: 0,
      skipped: 0,
    });
    expect(subs.send).not.toHaveBeenCalled();
  });

  it('never runs two purges at once', async () => {
    const { db } = fakeDb([{ id: 'a' }]);
    const service = new AccountPurgeService(db as never, client() as never);
    const [first, second] = await Promise.all([
      service.purgeDue(),
      service.purgeDue(),
    ]);
    expect(first.purged + second.purged).toBe(1);
  });
});
