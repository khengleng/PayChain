import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Bootstraps a demo tenant + API client for local/testnet development (§7, §34).
 * Credentials are dev-only. NEVER seed real secrets; production clients are provisioned
 * through the admin flow (a later milestone).
 */
const prisma = new PrismaClient();

const DEMO_CLIENT_ID = process.env.SEED_CLIENT_ID ?? 'demo-client';
const DEMO_CLIENT_SECRET = process.env.SEED_CLIENT_SECRET ?? 'demo-secret';

const SCOPES = [
  'wallet.read',
  'wallet.write',
  'asset.read',
  'asset.create',
  'asset.issue',
  'asset.transfer',
  'asset.burn',
];

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000001', name: 'PayKH Sandbox' },
  });

  const secretHash = createHash('sha256').update(DEMO_CLIENT_SECRET).digest('hex');
  await prisma.apiClient.upsert({
    where: { clientId: DEMO_CLIENT_ID },
    update: { clientSecretHash: secretHash, scopes: SCOPES, status: 'ACTIVE' },
    create: {
      tenantId: tenant.id,
      name: 'Demo Sandbox Client',
      clientId: DEMO_CLIENT_ID,
      clientSecretHash: secretHash,
      scopes: SCOPES,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Seeded tenant "${tenant.name}" and client "${DEMO_CLIENT_ID}" (secret: ${DEMO_CLIENT_SECRET})`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
