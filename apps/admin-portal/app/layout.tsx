import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayChain Admin',
  description: 'PayChain administration portal',
};

const NAV = [
  'Overview',
  'Tenants',
  'Wallets',
  'Assets',
  'Stablecoins',
  'Reserve',
  'Treasury',
  'Compliance',
  'Reconciliation',
  'Feature Flags',
  'Audit Logs',
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
                <a key={item} href="#">
                  {item}
                </a>
              ))}
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
