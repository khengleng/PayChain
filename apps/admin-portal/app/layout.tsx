import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { can, getSession } from '../lib/session';
import { LogoutButton } from './logout-button';

export const metadata: Metadata = {
  title: 'PayChain Admin',
  description: 'PayChain administration portal',
};

// force-dynamic so the session cookie is read per-request (never statically cached).
export const dynamic = 'force-dynamic';

const NAV: Array<{ label: string; href: string; perm?: string }> = [
  { label: 'Overview', href: '/' },
  { label: 'Readiness', href: '/readiness', perm: 'readiness:read' },
  { label: 'Tenants', href: '/tenants', perm: 'tenant:read' },
  { label: 'Wallets', href: '/wallets', perm: 'wallet:read' },
  { label: 'Assets', href: '/assets', perm: 'asset:read' },
  { label: 'Stablecoins', href: '/stablecoins', perm: 'stablecoin:read' },
  { label: 'Reserve', href: '/reserve', perm: 'reserve:read' },
  { label: 'Treasury', href: '/treasury', perm: 'treasury:read' },
  { label: 'Compliance', href: '/compliance', perm: 'compliance:read' },
  { label: 'Reconciliation', href: '/reconciliation', perm: 'reconciliation:read' },
  { label: 'Feature Flags', href: '/feature-flags', perm: 'flags:read' },
  { label: 'Audit Logs', href: '/audit-logs', perm: 'audit:read' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();

  return (
    <html lang="en">
      <body>
        {session ? (
          <div className="layout">
            <aside className="sidebar">
              <div className="brand">
                Pay<span>Chain</span>
              </div>
              <div className="brand-sub">Admin Portal</div>
              <nav className="nav">
                {NAV.filter((item) => !item.perm || can(session, item.perm)).map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="who">
                <div className="who-email">{session.email}</div>
                <div className="who-role">{session.role}</div>
                <LogoutButton />
              </div>
            </aside>
            <main className="main">{children}</main>
          </div>
        ) : (
          // /login renders full-screen (no shell)
          children
        )}
      </body>
    </html>
  );
}
