import { proxy } from '../../../../../lib/proxy';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return proxy('GET', `/admin/tenants/${params.id}/retailers`, { authed: true });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  return proxy('POST', `/admin/tenants/${params.id}/retailers`, { body, authed: true });
}
