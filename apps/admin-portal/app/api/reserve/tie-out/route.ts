import { proxy } from '../../../../lib/proxy';

export async function GET() {
  return proxy('GET', '/admin/reserve/tie-out', { authed: true });
}
