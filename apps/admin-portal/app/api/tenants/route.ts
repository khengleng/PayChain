import { proxy } from '../../../lib/proxy';

export async function GET() {
  return proxy('GET', '/admin/tenants', { authed: true });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxy('POST', '/admin/tenants', { body, authed: true });
}
