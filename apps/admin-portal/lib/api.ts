// Server-side API client for the admin portal. Authenticates to PayChain with platform
// admin credentials (held only on the server) via OAuth2 client-credentials, then reads
// admin endpoints. Returns null on any failure so pages can render a "not connected" state
// instead of crashing.

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';
const CLIENT_ID = process.env.ADMIN_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.ADMIN_CLIENT_SECRET ?? '';

export function apiConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

async function getToken(): Promise<string | null> {
  if (!apiConfigured()) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  } catch {
    return null;
  }
}

/** Authed GET against the API. Returns null on any error. */
export async function apiGet<T>(path: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export { API_BASE };
