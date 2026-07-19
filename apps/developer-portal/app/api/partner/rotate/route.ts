import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, API_BASE } from '../../../../lib/session';

/** Generate/rotate the partner's API secret (shown once) — proxies the partner JWT. */
export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const res = await fetch(`${API_BASE}/api/v1/partner/credentials/rotate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
