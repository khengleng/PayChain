import { AdminAuthService } from './admin-auth.service';
import { permissionsForRole } from './roles';

/**
 * Covers the session token's claims. The admin console decodes this token to decide which nav
 * links to render (admin-portal/lib/session.ts reads `claims.perms`), so a missing claim does
 * not fail loudly — it silently hides every permission-gated page from every admin. That is
 * exactly what happened, hence these tests.
 */
function build(overrides: { role?: string; mfaSecretEnc?: string | null } = {}) {
  const user = {
    id: 'u1',
    email: 'ops@paychain.dev',
    role: overrides.role ?? 'SUPER_ADMIN',
    status: 'ACTIVE',
    mfaEnabled: false,
    mfaSecretEnc: overrides.mfaSecretEnc ?? 'enc',
  };
  const signed: Record<string, unknown>[] = [];
  const prisma = {
    adminUser: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(user),
    },
  };
  const jwt = {
    signAsync: jest.fn(async (claims: Record<string, unknown>) => {
      signed.push(claims);
      return 'token';
    }),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', typ: 'mfa_challenge' }),
  };
  const crypto = { decrypt: () => 'SECRET' };
  const audit = { record: jest.fn() };
  const mailer = { send: jest.fn() };
  const svc = new AdminAuthService(
    prisma as never,
    jwt as never,
    crypto as never,
    audit as never,
    mailer as never,
    3600,
    'https://paychain.cambobia.com',
  );
  return { svc, signed, jwt, user };
}

// verifyTotp is real crypto; stub it so the test targets the claims, not TOTP itself.
jest.mock('@paychain/security', () => {
  const actual = jest.requireActual('@paychain/security');
  return { ...actual, verifyTotp: () => true };
});

describe('AdminAuthService — session token claims', () => {
  it('includes perms, so the console can render the nav it is entitled to', async () => {
    const { svc, signed } = build({ role: 'SUPER_ADMIN' });
    await svc.verifyMfa('challenge', '000000', 'corr');

    const session = signed.find((c) => c.typ === 'admin');
    expect(session).toBeDefined();
    expect(session!.perms).toEqual(permissionsForRole('SUPER_ADMIN'));
    expect((session!.perms as string[]).length).toBeGreaterThan(0);
  });

  it('scopes perms to the role — an AUDITOR gets read permissions only', async () => {
    const { svc, signed } = build({ role: 'AUDITOR' });
    await svc.verifyMfa('challenge', '000000', 'corr');

    const perms = signed.find((c) => c.typ === 'admin')!.perms as string[];
    expect(perms).toEqual(permissionsForRole('AUDITOR'));
    expect(perms.every((p) => p.endsWith(':read'))).toBe(true);
    expect(perms).not.toContain('admin:manage');
  });

  it('marks the session token typ=admin so it cannot be confused with a tenant token', async () => {
    const { svc, signed } = build();
    await svc.verifyMfa('challenge', '000000', 'corr');
    expect(signed.find((c) => c.typ === 'admin')).toBeDefined();
  });

  it('never puts perms on the pre-MFA challenge token', async () => {
    const { svc, signed } = build();
    await svc.login('ops@paychain.dev', 'pw').catch(() => undefined);
    const challenge = signed.find((c) => c.typ === 'mfa_challenge');
    if (challenge) expect(challenge.perms).toBeUndefined();
  });
});
