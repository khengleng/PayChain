import { proxy } from '../../../lib/proxy';

export async function GET() {
  return proxy('GET', '/admin/partner-applications', { authed: true });
}
