import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayChain Admin',
  description: 'PayChain administration portal',
};

const NAV: Array<{ label: string; href: string }> = [
  { label: 'Overview', href: '/' },
  { label: 'Readiness', href: '/readiness' },
  { label: 'Tenants', href: '/tenants' },
  { label: 'Wallets', href: '/wallets' },
  { label: 'Assets', href: '/assets' },
  { label: 'Stablecoins', href: '/stablecoins' },
  { label: 'Reserve', href: '/reserve' },
  { label: 'Treasury', href: '/treasury' },
  { label: 'Compliance', href: '/compliance' },
  { label: 'Reconciliation', href: '/reconciliation' },
  { label: 'Feature Flags', href: '/feature-flags' },
  { label: 'Audit Logs', href: '/audit-logs' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div className="brand">
              Pay<span>Chain</span>
            </div>
            <div className="brand-sub">Admin Portal</div>
            <nav className="nav">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
