import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, API_BASE } from '../../../lib/session';

/** Partner login → set the httpOnly session cookie from the API's partner JWT. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API_BASE}/api/v1/partner/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    return NextResponse.json(data, { status: res.status || 401 });
  }
  cookies().set(SESSION_COOKIE, data.access_token as string, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: (data.expires_in as number) ?? 3600,
  });
  return NextResponse.json({ ok: true });
}

/** Logout. */
export async function DELETE() {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
