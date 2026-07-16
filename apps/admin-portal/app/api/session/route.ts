import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../../lib/session';

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

/** Login: exchange email/password for an admin JWT and store it as an httpOnly cookie. */
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
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cookies().set(SESSION_COOKIE, data.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: data.expires_in,
  });
  return NextResponse.json({ ok: true });
}

/** Logout: clear the session cookie. */
export async function DELETE(): Promise<NextResponse> {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
