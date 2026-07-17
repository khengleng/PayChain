import { proxy } from '../../../../lib/proxy';

export async function POST() {
  return proxy('POST', '/admin/mainnet/enable', { authed: true });
}
