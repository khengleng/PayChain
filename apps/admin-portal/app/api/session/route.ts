import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../../lib/session';

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

/** Step 1 of login: email/password → MFA challenge. No session cookie is set here — a valid
 * TOTP code (via /api/mfa/verify) is required before any session is created. */
export async function POST(req: Request): Promise<NextResponse> {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const res = await fetch(`${API_BASE}/api/v1/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  // { mfaRequired, enrolled, challengeToken }
  return NextResponse.json(await res.json());
}

/** Logout: clear the session cookie. */
export async function DELETE(): Promise<NextResponse> {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
