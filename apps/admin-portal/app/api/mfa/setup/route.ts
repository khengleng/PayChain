import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://api.paychain.cambobia.com';

/** First-time enrollment: provision a TOTP secret and return it + a QR data URI to scan. */
export async function POST(req: Request): Promise<NextResponse> {
  const { challengeToken } = (await req.json()) as { challengeToken?: string };
  const res = await fetch(`${API_BASE}/api/v1/admin/auth/mfa/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken }),
  });
  if (!res.ok) return NextResponse.json({ error: 'Could not start MFA setup' }, { status: 400 });
  const data = (await res.json()) as { secret: string; otpauthUri: string };
  const qr = await QRCode.toDataURL(data.otpauthUri, { margin: 1, width: 200 });
  return NextResponse.json({ secret: data.secret, qr });
}
