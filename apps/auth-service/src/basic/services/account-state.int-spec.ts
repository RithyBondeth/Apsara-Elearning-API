import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EmailService, hashRefreshToken, JwtService } from '@app/common';
import { user } from '@app/database/schemas/user/user.schema';
import {
  createUser,
  days,
  openTestDb,
  resetDb,
} from '../../../../../test/db/test-db';
import { AccountDeletionService } from './account-deletion.service';
import type { LoginAttemptsService } from './login-attempts.service';
import { LoginService } from './login.service';
import { TokenService } from './token.service';

/**
 * Who may sign in and keep a session, read from real rows: suspension and a
 * pending self-deletion both close the door, and signing in during the grace
 * period is how a learner cancels their deletion.
 */
const { sql, db } = openTestDb();
const PASSWORD = 'correct-horse-battery';
let hash: string;

const jwt = {
  generateToken: jest.fn().mockResolvedValue('access'),
  generateRefreshToken: jest.fn().mockResolvedValue('refresh'),
  verifyRefreshToken: jest.fn(),
} as unknown as JwtService & { verifyRefreshToken: jest.Mock };
const config = { get: () => '7d' } as unknown as ConfigService;
const attempts = {
  assertNotLockedOut: jest.fn(),
  recordFailure: jest.fn(),
  clear: jest.fn(),
} as unknown as LoginAttemptsService;
const email = {
  sendAccountDeletionEmail: jest.fn().mockResolvedValue({}),
} as unknown as EmailService;

const login = new LoginService(db as never, jwt, config, attempts);
const tokens = new TokenService(db as never, jwt, config);
const deletion = new AccountDeletionService(db as never, email);

beforeAll(async () => {
  await resetDb(sql);
  hash = await bcrypt.hash(PASSWORD, 4);
});
afterAll(() => sql.end({ timeout: 1 }));

/** Gives the user a stored refresh token the refresh flow would accept. */
async function withSession(id: string) {
  await db
    .update(user)
    .set({
      refreshToken: hashRefreshToken('session'),
      refreshTokenExpiresAt: days(1),
    })
    .where(eq(user.id, id));
  jwt.verifyRefreshToken.mockResolvedValue({ id, type: 'refresh' });
}

describe('suspended accounts', () => {
  it('get 403 only with the right password', async () => {
    const u = await createUser(db, { password: hash, suspendedAt: days(-1) });
    await expect(
      login.login({ email: u.email, password: PASSWORD }),
    ).rejects.toMatchObject({
      error: { statusCode: 403, message: 'Account suspended' },
    });
    await expect(
      login.login({ email: u.email, password: 'wrong' }),
    ).rejects.toMatchObject({ error: { statusCode: 401 } });
  });

  it('cannot refresh an existing session', async () => {
    const u = await createUser(db, { password: hash, suspendedAt: days(-1) });
    await withSession(u.id);
    await expect(tokens.refresh('session')).rejects.toMatchObject({
      error: { statusCode: 401 },
    });
  });
});

describe('self-service deletion', () => {
  it('request → sessions revoked → refresh refused → sign-in cancels', async () => {
    const u = await createUser(db, { password: hash });
    await withSession(u.id);

    const { deleteAfter } = await deletion.request({
      userId: u.id,
      password: PASSWORD,
    });
    const [pending] = await db.select().from(user).where(eq(user.id, u.id));
    expect(pending.refreshToken).toBeNull();
    expect(deleteAfter.getTime() - pending.deletionRequestedAt!.getTime()).toBe(
      7 * 86_400_000,
    );

    // Even with a token that would otherwise match, refresh is refused.
    await withSession(u.id);
    await expect(tokens.refresh('session')).rejects.toMatchObject({
      error: { statusCode: 401 },
    });

    const res = await login.login({ email: u.email, password: PASSWORD });
    expect(res.deletionCancelled).toBe(true);
    const [after] = await db.select().from(user).where(eq(user.id, u.id));
    expect(after.deletionRequestedAt).toBeNull();
  });

  it('asking again keeps the original date', async () => {
    const requestedAt = days(-3);
    const u = await createUser(db, {
      password: hash,
      deletionRequestedAt: requestedAt,
    });
    await deletion.request({ userId: u.id, password: PASSWORD });
    const [row] = await db.select().from(user).where(eq(user.id, u.id));
    expect(row.deletionRequestedAt!.getTime()).toBe(requestedAt.getTime());
  });
});
