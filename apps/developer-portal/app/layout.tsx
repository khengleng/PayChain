import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayChain Docs',
  description: 'PayChain proprietary integration docs for wallets, assets, loyalty, and partner SDKs',
};

const LINKS = [
  { label: 'Quickstart', href: '/' },
  { label: 'Integration', href: '/integration' },
  { label: 'Trustee', href: '/trustee-integration' },
  { label: 'API', href: '/api-reference' },
  { label: 'Webhooks', href: '/webhooks' },
  { label: 'SDK', href: '/sdk' },
  { label: 'Status', href: '/status' },
  { label: 'Become a partner', href: '/register' },
  { label: 'Sign in', href: '/login' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="topnav">
          <div className="topnav-inner">
            <Link href="/" className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/paychain-icon.svg" alt="" width={24} height={24} />
              <span className="logo-word">Pay<span>Chain</span></span> Docs
            </Link>
            <div className="links">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
