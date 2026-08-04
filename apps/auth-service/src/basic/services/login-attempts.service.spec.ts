import { RedisService } from '@app/common';
import {
  LoginAttemptsService,
  LOCKOUT_SECONDS,
  MAX_FAILED_ATTEMPTS,
} from './login-attempts.service';

const EMAIL = 'student@apsara.example.com';

/**
 * Returns the mocks alongside the service-shaped object, so assertions target
 * plain jest.fn()s rather than method references pulled off an instance.
 */
function buildRedis(
  seed: { failures?: number | null; noRedis?: boolean } = {},
) {
  const mocks = {
    get: jest.fn().mockResolvedValue(seed.failures ?? null),
    del: jest.fn().mockResolvedValue(undefined),
    incr: jest.fn().mockResolvedValue(seed.noRedis ? null : 1),
  };
  const redis = {
    key: (entity: string, type: string, id: string) =>
      `apsara-elearning:${entity}:${type}:${id}`,
    ...mocks,
  } as unknown as RedisService;
  return { redis, mocks };
}

describe('LoginAttemptsService', () => {
  it('allows a login when there are no recorded failures', async () => {
    const { redis } = buildRedis();
    const service = new LoginAttemptsService(redis);
    await expect(service.assertNotLockedOut(EMAIL)).resolves.toBeUndefined();
  });

  it('allows a login just below the threshold', async () => {
    const { redis } = buildRedis({ failures: MAX_FAILED_ATTEMPTS - 1 });
    const service = new LoginAttemptsService(redis);
    await expect(service.assertNotLockedOut(EMAIL)).resolves.toBeUndefined();
  });

  it('locks out at the threshold with a 429', async () => {
    const { redis } = buildRedis({ failures: MAX_FAILED_ATTEMPTS });
    const service = new LoginAttemptsService(redis);

    await expect(service.assertNotLockedOut(EMAIL)).rejects.toMatchObject({
      error: { statusCode: 429 },
    });
  });

  it('never puts the raw email in the redis key', async () => {
    const { redis, mocks } = buildRedis();
    const service = new LoginAttemptsService(redis);

    await service.recordFailure(EMAIL);

    const [key] = mocks.incr.mock.calls[0] as [string, number];
    expect(key).not.toContain(EMAIL);
    expect(key).not.toContain('student');
    expect(key).toMatch(/^apsara-elearning:auth:login-failures:[a-f0-9]{64}$/);
  });

  it('counts different casings of an address as the same account', async () => {
    const { redis, mocks } = buildRedis();
    const service = new LoginAttemptsService(redis);

    await service.recordFailure(EMAIL);
    await service.recordFailure(`  ${EMAIL.toUpperCase()}  `);

    const calls = mocks.incr.mock.calls as [string, number][];
    expect(calls[0][0]).toBe(calls[1][0]);
  });

  it('expires the counter so a lockout is temporary', async () => {
    const { redis, mocks } = buildRedis();
    const service = new LoginAttemptsService(redis);

    await service.recordFailure(EMAIL);

    expect(mocks.incr).toHaveBeenCalledWith(
      expect.any(String),
      LOCKOUT_SECONDS,
    );
  });

  it('clears the counter on a successful sign-in', async () => {
    const { redis, mocks } = buildRedis();
    const service = new LoginAttemptsService(redis);

    await service.clear(EMAIL);

    expect(mocks.del).toHaveBeenCalledTimes(1);
  });

  it('does not lock anyone out when redis is unconfigured', async () => {
    // RedisService returns null for every read without a client; that must read
    // as "no opinion", not as a count that could block a legitimate learner.
    const { redis } = buildRedis({ noRedis: true });
    const service = new LoginAttemptsService(redis);

    await service.recordFailure(EMAIL);
    await expect(service.assertNotLockedOut(EMAIL)).resolves.toBeUndefined();
  });
});
