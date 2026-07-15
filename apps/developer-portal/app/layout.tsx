import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayChain Developers',
  description: 'PayChain developer portal — integrate wallets, assets, and loyalty',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
