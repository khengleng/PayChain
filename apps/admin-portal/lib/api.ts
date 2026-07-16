// Server-side API client for the admin portal. Uses the LOGGED-IN ADMIN's JWT (from the
// httpOnly session cookie) as the Bearer token, so every call is attributed to and authorized
// for that human admin (RBAC/ABAC enforced by the API). Returns null on any failure so pages
// render a graceful "not permitted / unavailable" state.
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './session';

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

function token(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}

export async function apiGet<T>(path: string): Promise<T | null> {
  const t = token();
  if (!t) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${t}` },
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export { API_BASE };
