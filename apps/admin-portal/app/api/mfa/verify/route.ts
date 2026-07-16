import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../../../lib/session';

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

/** Step 2: verify the TOTP code → mint the admin session and set the httpOnly cookie. */
export async function POST(req: Request): Promise<NextResponse> {
  const { challengeToken, code } = (await req.json()) as { challengeToken?: string; code?: string };
  const res = await fetch(`${API_BASE}/api/v1/admin/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken, code }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Invalid authentication code' }, { status: 401 });
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
