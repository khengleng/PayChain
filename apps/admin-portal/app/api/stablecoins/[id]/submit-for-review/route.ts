import { proxy } from '../../../../../lib/proxy';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return proxy('POST', `/admin/stablecoins/${params.id}/submit-for-review`, { authed: true });
}
