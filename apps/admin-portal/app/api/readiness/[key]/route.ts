import { proxy } from '../../../../lib/proxy';

export async function POST(req: Request, { params }: { params: { key: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxy('POST', `/admin/readiness/${params.key}`, { body, authed: true });
}
