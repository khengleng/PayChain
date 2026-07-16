import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import type { AdminedRequest } from './admin-context';

function contextFor(header: string | undefined): { ctx: never; req: AdminedRequest } {
  const req = { headers: { authorization: header } } as unknown as AdminedRequest;
  const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as never;
  return { ctx, req };
}

function guard(verify: jest.Mock, findUnique: jest.Mock): AdminAuthGuard {
  return new AdminAuthGuard({ verifyAsync: verify } as never, { adminUser: { findUnique } } as never);
}

describe('AdminAuthGuard (security)', () => {
  it('rejects a non-admin (tenant/machine) token even if the signature is valid', async () => {
    const g = guard(jest.fn().mockResolvedValue({ sub: 'c1', tid: 't1', typ: undefined }), jest.fn());
    const { ctx } = contextFor('Bearer x');
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid/forged signature', async () => {
    const g = guard(jest.fn().mockRejectedValue(new Error('bad sig')), jest.fn());
    const { ctx } = contextFor('Bearer x');
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('locks out a DISABLED admin immediately (does not trust the token)', async () => {
    const g = guard(
      jest.fn().mockResolvedValue({ sub: 'u1', typ: 'admin' }),
      jest.fn().mockResolvedValue({ id: 'u1', email: 'a@x', role: 'SUPER_ADMIN', status: 'DISABLED', attributes: {} }),
    );
    const { ctx } = contextFor('Bearer x');
    await expect(g.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('derives permissions from the CURRENT DB role, ignoring any perms in the token', async () => {
    // Token falsely claims SUPER_ADMIN perms, but the DB says AUDITOR (read-only).
    const g = guard(
      jest.fn().mockResolvedValue({ sub: 'u1', typ: 'admin', perms: ['emergency:execute', 'mainnet:enable'] }),
      jest.fn().mockResolvedValue({ id: 'u1', email: 'a@x', role: 'AUDITOR', status: 'ACTIVE', attributes: {} }),
    );
    const { ctx, req } = contextFor('Bearer x');
    await expect(g.canActivate(ctx)).resolves.toBe(true);
    expect(req.admin?.role).toBe('AUDITOR');
    expect(req.admin?.permissions).toContain('readiness:read');
    // The forged high-privilege permissions are NOT granted.
    expect(req.admin?.permissions).not.toContain('emergency:execute');
    expect(req.admin?.permissions).not.toContain('mainnet:enable');
  });
});
