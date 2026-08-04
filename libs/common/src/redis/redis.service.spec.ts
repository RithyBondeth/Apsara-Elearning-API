import { RedisService } from './redis.service';

/** ioredis' multi() builder: chainable, resolving to [err, value] pairs. */
function fakeClient(execResult: [Error | null, unknown][] | null) {
  const expire = jest.fn().mockReturnThis();
  const incr = jest.fn().mockReturnThis();
  const chain = { incr, expire, exec: jest.fn().mockResolvedValue(execResult) };
  return { client: { multi: () => chain }, chain };
}

describe('RedisService.incr', () => {
  it('returns the new counter value', async () => {
    const { client } = fakeClient([
      [null, 3],
      [null, 1],
    ]);
    const service = new RedisService(client as never);

    await expect(service.incr('k', 900)).resolves.toBe(3);
  });

  it('applies the TTL without the Redis 7+ NX flag', async () => {
    // EXPIRE ... NX errors on Redis 6, which would leave the counter with no
    // TTL at all — a permanent lockout for whoever it was counting.
    const { client, chain } = fakeClient([
      [null, 1],
      [null, 1],
    ]);
    const service = new RedisService(client as never);

    await service.incr('k', 900);

    expect(chain.expire).toHaveBeenCalledWith('k', 900);
    expect(chain.expire).not.toHaveBeenCalledWith('k', 900, 'NX');
  });

  it('reports null when the increment itself failed', async () => {
    const { client } = fakeClient([[new Error('READONLY'), null]]);
    const service = new RedisService(client as never);

    await expect(service.incr('k', 900)).resolves.toBeNull();
  });

  it('reports null when the transaction was aborted', async () => {
    const { client } = fakeClient(null);
    const service = new RedisService(client as never);

    await expect(service.incr('k', 900)).resolves.toBeNull();
  });

  it('reports null when redis is not configured', async () => {
    const service = new RedisService(null);

    await expect(service.incr('k', 900)).resolves.toBeNull();
  });
});
