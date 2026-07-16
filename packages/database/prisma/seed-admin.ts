import { hashPassword } from '@paychain/security';
import { PrismaClient } from '@prisma/client';

/**
 * Provisions (or updates) a platform admin user (§8). Run with env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, [ADMIN_ROLE=SUPER_ADMIN], [ADMIN_NAME]
 *
 * This is the bootstrap/break-glass path — the first admin, or recovery when nobody can log in.
 * Routine accounts are created in the admin console (Admins page), which is audited and applies
 * the no-self-lockout rules; this script bypasses all of that, so keep its use rare and logged.
 *
 * Hashing is imported from @paychain/security rather than reimplemented: a local copy that drifts
 * from the verifier would silently lock the break-glass account out of its own platform.
 */
const prisma = new PrismaClient();

const EMAIL = (process.env.ADMIN_EMAIL ?? '').toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const ROLE = (process.env.ADMIN_ROLE ?? 'SUPER_ADMIN') as never;
const NAME = process.env.ADMIN_NAME ?? 'Platform Admin';

async function main(): Promise<void> {
  if (!EMAIL || !PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }
  const passwordHash = hashPassword(PASSWORD);
  const user = await prisma.adminUser.upsert({
    where: { email: EMAIL },
    update: { passwordHash, role: ROLE, status: 'ACTIVE', fullName: NAME },
    create: { email: EMAIL, passwordHash, role: ROLE, fullName: NAME, createdBy: 'seed' },
  });
  // eslint-disable-next-line no-console
  console.log(`Provisioned admin "${user.email}" with role ${user.role}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
