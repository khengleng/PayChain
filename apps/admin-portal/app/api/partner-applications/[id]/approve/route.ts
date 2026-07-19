import { proxy } from '../../../../../lib/proxy';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return proxy('POST', `/admin/partner-applications/${params.id}/approve`, { authed: true });
}
