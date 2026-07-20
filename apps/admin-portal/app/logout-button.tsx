'use client';

export function LogoutButton() {
  async function logout() {
    await fetch('/api/session', { method: 'DELETE' }).catch(() => undefined);
    // Hard navigation straight to /login — a soft router.push would re-render the (now
    // unauthorized) shell first, flashing the home screen before the redirect settles.
    window.location.assign('/login');
  }
  return (
    <button className="logout-btn" onClick={logout} type="button">
      Sign out
    </button>
  );
}
