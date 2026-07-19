import { proxy } from '../../../../../lib/proxy';

export async function POST() {
  return proxy('POST', '/admin/reserve/tie-out/check', { authed: true });
}
