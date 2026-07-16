import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from './session';

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

/** Proxy a request to the API. `authed` attaches the admin's session JWT (for admin-only ops). */
export async function proxy(
  method: string,
  path: string,
  opts: { body?: unknown; authed?: boolean } = {},
): Promise<NextResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.authed) {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export { API_BASE };
