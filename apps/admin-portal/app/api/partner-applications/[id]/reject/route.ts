import { proxy } from '../../../../../lib/proxy';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxy('POST', `/admin/partner-applications/${params.id}/reject`, { body, authed: true });
}
