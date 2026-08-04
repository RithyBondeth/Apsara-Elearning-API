import { GatewayThrottlerGuard } from './throttler.guard';
import { CLIENT_IP_HEADER, PROXY_SECRET_HEADER } from './client-ip';

const SECRET = 'a'.repeat(32);

/** Reaches the protected tracker without standing up the whole guard. */
const trackerOf = (guard: GatewayThrottlerGuard) => {
  const exposed = guard as unknown as {
    getTracker(req: unknown): Promise<string>;
  };
  return exposed.getTracker.bind(exposed);
};

function buildGuard(verify: jest.Mock, proxySecret?: string) {
  return new GatewayThrottlerGuard(
    { throttlers: [] },
    {} as never,
    {} as never,
    { verifyToken: verify } as never,
    { get: () => proxySecret } as never,
  );
}

describe('GatewayThrottlerGuard tracker', () => {
  it('buckets an authenticated call by user id, not by the shared BFF IP', async () => {
    const verify = jest.fn().mockResolvedValue({ id: 'user-1' });
    const getTracker = trackerOf(buildGuard(verify, SECRET));

    await expect(
      getTracker({ ip: '10.0.0.5', headers: { authorization: 'Bearer good' } }),
    ).resolves.toBe('user:user-1');
    expect(verify).toHaveBeenCalledWith('good');
  });

  it('gives two students on one BFF egress IP separate buckets', async () => {
    const verify = jest
      .fn()
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({ id: 'user-2' });
    const getTracker = trackerOf(buildGuard(verify, SECRET));

    const first = await getTracker({
      ip: '10.0.0.5',
      headers: { authorization: 'Bearer a' },
    });
    const second = await getTracker({
      ip: '10.0.0.5',
      headers: { authorization: 'Bearer b' },
    });
    expect(first).not.toBe(second);
  });

  it('falls back to the client IP when the token is invalid', async () => {
    const verify = jest.fn().mockRejectedValue(new Error('expired'));
    const getTracker = trackerOf(buildGuard(verify, SECRET));

    await expect(
      getTracker({
        ip: '10.0.0.5',
        headers: {
          authorization: 'Bearer expired',
          [PROXY_SECRET_HEADER]: SECRET,
          [CLIENT_IP_HEADER]: '203.0.113.9',
        },
      }),
    ).resolves.toBe('ip:203.0.113.9');
  });

  it('buckets anonymous auth calls by the declared browser IP', async () => {
    const verify = jest.fn();
    const getTracker = trackerOf(buildGuard(verify, SECRET));

    await expect(
      getTracker({
        ip: '10.0.0.5',
        headers: {
          [PROXY_SECRET_HEADER]: SECRET,
          [CLIENT_IP_HEADER]: '203.0.113.9',
        },
      }),
    ).resolves.toBe('ip:203.0.113.9');
    expect(verify).not.toHaveBeenCalled();
  });

  it('ignores a non-bearer authorization header', async () => {
    const verify = jest.fn();
    const getTracker = trackerOf(buildGuard(verify, SECRET));

    await expect(
      getTracker({ ip: '10.0.0.5', headers: { authorization: 'Basic abc' } }),
    ).resolves.toBe('ip:10.0.0.5');
    expect(verify).not.toHaveBeenCalled();
  });
});
