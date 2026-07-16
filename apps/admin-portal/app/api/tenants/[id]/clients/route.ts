import { proxy } from '../../../../../lib/proxy';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return proxy('GET', `/admin/tenants/${params.id}/clients`, { authed: true });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxy('POST', `/admin/tenants/${params.id}/clients`, { body, authed: true });
}
