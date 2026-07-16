import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'pc_admin';

function isExpired(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.exp === 'number' && claims.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/** Gate the whole portal behind an admin session; bounce to /login when unauthenticated. */
const PUBLIC_PATHS = ['/login', '/forgot', '/reset-password'];

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = Boolean(token) && !isExpired(token);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (authed && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Protect everything except Next internals, the (public) auth route handlers under /api,
  // the generated favicon/app-icon, brand assets, and any static file (has a dot extension).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|brand/|api/|.*\\.).*)'],
};
