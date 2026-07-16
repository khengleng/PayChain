import { proxy } from '../../../lib/proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxy('POST', '/admin/flags', { body, authed: true });
}
