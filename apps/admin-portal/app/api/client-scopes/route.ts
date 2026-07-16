import { proxy } from '../../../lib/proxy';

export async function GET() {
  return proxy('GET', '/admin/client-scopes', { authed: true });
}
