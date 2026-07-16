import { proxy } from '../../../lib/proxy';

export async function GET(req: Request) {
  const qs = new URL(req.url).search;
  return proxy('GET', `/admin/audit${qs}`, { authed: true });
}
