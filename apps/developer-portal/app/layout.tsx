import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayChain Developers',
  description: 'PayChain developer portal — integrate wallets, assets, and loyalty',
};

const LINKS = [
  { label: 'Quickstart', href: '/' },
  { label: 'Integration', href: '/integration' },
  { label: 'API', href: '/api-reference' },
  { label: 'Webhooks', href: '/webhooks' },
  { label: 'SDK', href: '/sdk' },
  { label: 'Status', href: '/status' },
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
              <span className="logo-word">Pay<span>Chain</span></span> Developers
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
