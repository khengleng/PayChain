'use client';

import { useEffect } from 'react';

/**
 * Sends the admin straight to /login the moment their session expires, instead of leaving them on
 * whatever page they were viewing (which would keep rendering the shell with empty/unauthorized
 * data). Mirrors a logout: clear the cookie, then a HARD navigation to the login screen — no home
 * screen in between. The server middleware is the real gate on navigation; this handles the
 * idle-past-expiry case where the user never navigates.
 */
export function SessionExpiryGuard({ exp }: { exp?: number }) {
  useEffect(() => {
    if (!exp) return;
    const toLogin = () => {
      void fetch('/api/session', { method: 'DELETE' })
        .catch(() => undefined)
        .finally(() => window.location.assign('/login'));
    };
    const msLeft = exp * 1000 - Date.now();
    if (msLeft <= 0) {
      toLogin();
      return;
    }
    const timer = setTimeout(toLogin, msLeft);
    return () => clearTimeout(timer);
  }, [exp]);

  return null;
}
