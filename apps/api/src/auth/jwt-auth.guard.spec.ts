import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthedRequest } from './auth-context';

function contextFor(header: string | undefined): { ctx: never; req: AuthedRequest } {
  const req = { headers: { authorization: header } } as unknown as AuthedRequest;
  const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as never;
  return { ctx, req };
}

describe('JwtAuthGuard (security)', () => {
  it('accepts a valid tenant/machine token and sets tenant context', async () => {
    const g = new JwtAuthGuard({ verifyAsync: jest.fn().mockResolvedValue({ sub: 'c1', tid: 't1', scopes: ['wallet.read'] }) } as never);
    const { ctx, req } = contextFor('Bearer x');
    await expect(g.canActivate(ctx)).resolves.toBe(true);
    expect(req.auth?.tenantId).toBe('t1');
  });

  it('rejects an admin (human) token on tenant endpoints', async () => {
    const g = new JwtAuthGuard({ verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', typ: 'admin' }) } as never);
    const { ctx } = contextFor('Bearer x');
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token with no tenant id', async () => {
    const g = new JwtAuthGuard({ verifyAsync: jest.fn().mockResolvedValue({ sub: 'c1', scopes: [] }) } as never);
    const { ctx } = contextFor('Bearer x');
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
