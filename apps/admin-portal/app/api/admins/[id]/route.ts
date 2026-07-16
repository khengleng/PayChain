import { proxy } from '../../../../lib/proxy';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  return proxy('PATCH', `/admin/users/${params.id}`, { body, authed: true });
}
