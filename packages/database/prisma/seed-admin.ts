import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Provisions (or updates) a platform admin user (§8). Run with env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, [ADMIN_ROLE=SUPER_ADMIN], [ADMIN_NAME]
 * Password hashing matches @paychain/security (scrypt$salt$hash).
 */
const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

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
