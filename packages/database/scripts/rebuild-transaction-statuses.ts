/**
 * Rebuild on-chain transaction confirmation status from the authoritative chain (§17, §32).
 *
 * Usage:
 *   DATABASE_URL=... STELLAR_HORIZON_URL=... npx tsx scripts/rebuild-transaction-statuses.ts [--tenant <id>] [--dry-run]
 */
import { createPrismaClient } from '../src/index';
import { loadConfig } from '@paychain/config';
import { StellarProvider } from '@paychain/stellar';

interface Args {
  tenantId?: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const tenantIdx = argv.indexOf('--tenant');
  return {
    tenantId: tenantIdx > -1 ? argv[tenantIdx + 1] : undefined,
    dryRun: argv.includes('--dry-run'),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = loadConfig();
  const prisma = createPrismaClient(process.env.DATABASE_URL);
  const chain = new StellarProvider({
    network: cfg.STELLAR_NETWORK,
    horizonUrl: cfg.STELLAR_HORIZON_URL,
    networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
  });

  const txs = await prisma.transaction.findMany({
    where: {
      blockchainHash: { not: null },
      ...(args.tenantId ? { tenantId: args.tenantId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, tenantId: true, type: true, status: true, blockchainHash: true },
  });

  console.log(
    `${args.dryRun ? '[dry-run] ' : ''}Rebuilding ${txs.length} transaction status row(s) from chain (${cfg.STELLAR_NETWORK})`,
  );

  let updated = 0;
  let unchanged = 0;
  let failedLookups = 0;

  for (const tx of txs) {
    if (!tx.blockchainHash) continue;
    try {
      const onChain = await chain.getTransaction({ transactionHash: tx.blockchainHash });
      const nextStatus =
        onChain.status === 'confirmed'
          ? 'CONFIRMED'
          : onChain.status === 'failed'
            ? 'FAILED'
            : 'PENDING_CONFIRMATION';
      if (nextStatus === tx.status) {
        unchanged += 1;
        continue;
      }

      console.log(`  ${tx.id} ${tx.type}: ${tx.status} -> ${nextStatus}`);
      updated += 1;
      if (!args.dryRun) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data:
            nextStatus === 'CONFIRMED'
              ? { status: 'CONFIRMED', confirmedAt: new Date(), failureCode: null, failureReason: null }
              : nextStatus === 'FAILED'
                ? { status: 'FAILED', failureCode: 'CHAIN_FAILED', failureReason: 'chain reported failure' }
                : { status: 'PENDING_CONFIRMATION' },
        });
      }
    } catch (err) {
      failedLookups += 1;
      console.error(`  ${tx.id}: FAILED to read chain — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(
    `\n${args.dryRun ? '[dry-run] ' : ''}${updated} updated · ${unchanged} unchanged · ${failedLookups} failed lookups`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e?.message ?? e);
  process.exit(1);
});
