import { proxy } from '../../../../../lib/proxy';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxy('POST', `/admin/clients/${params.id}/status`, { body, authed: true });
}
