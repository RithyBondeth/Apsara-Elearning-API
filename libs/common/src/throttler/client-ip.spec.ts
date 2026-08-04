import {
  CLIENT_IP_HEADER,
  PROXY_SECRET_HEADER,
  resolveClientIp,
} from './client-ip';

const SECRET = 'a'.repeat(32);

const request = (headers: Record<string, string> = {}, ip = '10.0.0.5') => ({
  ip,
  headers,
});

describe('resolveClientIp', () => {
  it('uses the socket address when no proxy secret is configured', () => {
    const req = request({
      [PROXY_SECRET_HEADER]: SECRET,
      [CLIENT_IP_HEADER]: '203.0.113.9',
    });
    expect(resolveClientIp(req, undefined)).toBe('10.0.0.5');
  });

  it('trusts the declared client IP when the secret matches', () => {
    const req = request({
      [PROXY_SECRET_HEADER]: SECRET,
      [CLIENT_IP_HEADER]: '203.0.113.9',
    });
    expect(resolveClientIp(req, SECRET)).toBe('203.0.113.9');
  });

  it('ignores a forged client IP when the secret is wrong', () => {
    const req = request({
      [PROXY_SECRET_HEADER]: 'b'.repeat(32),
      [CLIENT_IP_HEADER]: '203.0.113.9',
    });
    expect(resolveClientIp(req, SECRET)).toBe('10.0.0.5');
  });

  it('ignores a client IP presented with no secret at all', () => {
    const req = request({ [CLIENT_IP_HEADER]: '203.0.113.9' });
    expect(resolveClientIp(req, SECRET)).toBe('10.0.0.5');
  });

  it('does not leak length information through the comparison', () => {
    const req = request({
      [PROXY_SECRET_HEADER]: 'short',
      [CLIENT_IP_HEADER]: '203.0.113.9',
    });
    expect(resolveClientIp(req, SECRET)).toBe('10.0.0.5');
  });

  it('falls back to the socket address when the declared IP is blank', () => {
    const req = request({
      [PROXY_SECRET_HEADER]: SECRET,
      [CLIENT_IP_HEADER]: '   ',
    });
    expect(resolveClientIp(req, SECRET)).toBe('10.0.0.5');
  });

  it('falls back to the raw socket when express has not populated req.ip', () => {
    expect(
      resolveClientIp({ socket: { remoteAddress: '198.51.100.2' } }, SECRET),
    ).toBe('198.51.100.2');
  });

  it('never returns undefined', () => {
    expect(resolveClientIp({}, SECRET)).toBe('unknown');
  });
});
