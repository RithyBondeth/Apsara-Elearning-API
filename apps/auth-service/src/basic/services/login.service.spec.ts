import * as bcrypt from 'bcrypt';
import { JwtService } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { LoginService } from './login.service';
import type { LoginAttemptsService } from './login-attempts.service';

/**
 * Account-state gates on login. Credential checks and lockout live in
 * login-attempts.service.spec; these pin what a *correct* password still
 * can't get past, and that nothing is issued when it can't.
 */

const PASSWORD = 'correct-horse';
let passwordHash: string;
beforeAll(async () => {
  passwordHash = await bcrypt.hash(PASSWORD, 4);
});

function fakeDb(found: unknown) {
  const update = jest.fn(() => ({
    set: () => ({ where: () => Promise.resolve(undefined) }),
  }));
  return {
    db: {
      select: () => {
        const node: Record<string, unknown> = {};
        for (const m of ['from', 'where', 'limit']) node[m] = () => node;
        node.then = (
          res: (v: unknown) => unknown,
          rej: (r: unknown) => unknown,
        ) => Promise.resolve(found ? [found] : []).then(res, rej);
        return node;
      },
      update,
    },
    update,
  };
}

const jwt = () =>
  ({
    generateToken: jest.fn().mockResolvedValue('access'),
    generateRefreshToken: jest.fn().mockResolvedValue('refresh'),
  }) as unknown as JwtService;

const attempts = {
  assertNotLockedOut: jest.fn().mockResolvedValue(undefined),
  recordFailure: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
} as unknown as LoginAttemptsService;

const config = { get: () => '7d' } as unknown as ConfigService;

const account = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'a@b.com',
  password: passwordHash,
  isAdmin: false,
  isEmailVerified: true,
  suspendedAt: null,
  ...over,
});

describe('LoginService.login account state', () => {
  it('logs in an active, verified account', async () => {
    const { db, update } = fakeDb(account());
    const service = new LoginService(db as never, jwt(), config, attempts);
    const res = await service.login({ email: 'a@b.com', password: PASSWORD });
    expect(res.accessToken).toBe('access');
    expect(update).toHaveBeenCalled();
  });

  it('refuses a suspended account with 403 and issues nothing', async () => {
    const generateToken = jest.fn().mockResolvedValue('access');
    const tokens = {
      generateToken,
      generateRefreshToken: jest.fn(),
    } as unknown as JwtService;
    const { db, update } = fakeDb(account({ suspendedAt: new Date() }));
    const service = new LoginService(db as never, tokens, config, attempts);

    await expect(
      service.login({ email: 'a@b.com', password: PASSWORD }),
    ).rejects.toMatchObject({
      error: { statusCode: 403, message: 'Account suspended' },
    });
    expect(generateToken).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('does not reveal suspension to a wrong password', async () => {
    const { db } = fakeDb(account({ suspendedAt: new Date() }));
    const service = new LoginService(db as never, jwt(), config, attempts);
    await expect(
      service.login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toMatchObject({ error: { statusCode: 401 } });
  });
});
