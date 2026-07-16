import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../../../../lib/session';

const API_BASE = process.env.PAYCHAIN_API_URL ?? 'https://api.paychain.cambobia.com';

/**
 * CSV passes through as a file download rather than through `proxy`, which assumes JSON. The
 * Content-Disposition from the API is preserved so the browser saves it with a filename.
 */
export async function GET(req: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return new Response('Unauthorized', { status: 401 });
  const qs = new URL(req.url).search;
  const res = await fetch(`${API_BASE}/api/v1/admin/audit/export.csv${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return new Response('Export failed', { status: res.status });
  return new Response(await res.text(), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        res.headers.get('content-disposition') ?? 'attachment; filename="paychain-audit-export.csv"',
    },
  });
}
