import { ForbiddenException } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { TrusteeIpAllowlistGuard } from './trustee-ip-allowlist.guard';

describe('TrusteeIpAllowlistGuard', () => {
  function ctx(headers: Record<string, string | undefined>, ip?: string) {
    return {
      switchToHttp: () => ({ getRequest: () => ({ headers, ip, socket: { remoteAddress: ip } }) }),
    } as never;
  }
  const guard = (ips: string[]) =>
    new TrusteeIpAllowlistGuard({ TRUSTEE_ALLOWED_IPS: ips } as unknown as PayChainConfig);

  it('allows any source when the allowlist is empty (signature-only)', () => {
    expect(guard([]).canActivate(ctx({ 'x-forwarded-for': '9.9.9.9' }))).toBe(true);
  });

  it('allows an exact-match IP from X-Forwarded-For', () => {
    expect(guard(['1.2.3.4']).canActivate(ctx({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe(true);
  });

  it('allows an IPv6-mapped IPv4 that matches', () => {
    expect(guard(['1.2.3.4']).canActivate(ctx({ 'x-forwarded-for': '::ffff:1.2.3.4' }))).toBe(true);
  });

  it('allows an IP inside a CIDR range', () => {
    expect(guard(['10.0.0.0/24']).canActivate(ctx({ 'x-forwarded-for': '10.0.0.200' }))).toBe(true);
    expect(guard(['10.0.0.0/8']).canActivate(ctx({ 'x-forwarded-for': '10.255.1.1' }))).toBe(true);
  });

  it('rejects an IP outside every rule with 403', () => {
    expect(() => guard(['1.2.3.4', '10.0.0.0/24']).canActivate(ctx({ 'x-forwarded-for': '8.8.8.8' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects an IP just outside a CIDR boundary', () => {
    expect(() => guard(['10.0.0.0/24']).canActivate(ctx({ 'x-forwarded-for': '10.0.1.1' }))).toThrow(
      ForbiddenException,
    );
  });

  it('falls back to socket address when no XFF header is present', () => {
    expect(guard(['5.5.5.5']).canActivate(ctx({}, '5.5.5.5'))).toBe(true);
    expect(() => guard(['5.5.5.5']).canActivate(ctx({}, '6.6.6.6'))).toThrow(ForbiddenException);
  });
});
