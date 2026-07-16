'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }
  return (
    <button className="logout-btn" onClick={logout} type="button">
      Sign out
    </button>
  );
}
