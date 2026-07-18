import { proxy } from '../../../../../lib/proxy';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  return proxy('POST', `/admin/clients/${params.id}/policy`, { body, authed: true });
}
