import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, API_BASE } from '../../lib/session';
import OnboardingClient, { type PartnerApplication } from './onboarding-client';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');
  const res = await fetch(`${API_BASE}/api/v1/partner/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) redirect('/login');
  const application = (await res.json()) as PartnerApplication;
  return <OnboardingClient application={application} />;
}
