import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'pc_admin';

export interface AdminSession {
  email: string;
  role: string;
  permissions: string[];
  exp?: number;
}

/** Decode (not verify) the admin JWT payload for display + nav filtering. The API is the real
 * authorization boundary — it verifies the token on every call. */
export function decodeSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (claims.typ !== 'admin') return null;
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return { email: claims.email, role: claims.role, permissions: claims.perms ?? [], exp: claims.exp };
  } catch {
    return null;
  }
}

export function getSession(): AdminSession | null {
  return decodeSession(cookies().get(SESSION_COOKIE)?.value);
}

export function can(session: AdminSession | null, permission: string): boolean {
  return Boolean(session?.permissions.includes(permission));
}
