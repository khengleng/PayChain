/**
 * Rebuild the wallet-balance read model from the chain (§32).
 *
 * §32 requires rebuild commands for the read models. This one did not exist — yet
 * balance.service.ts and schema.prisma both referenced `rebuild:wallet-balances` by name, and
 * docs/product/execution-plan.md asserted "rebuild command exists". It did not.
 *
 * That gap matters more than a missing script. §47: "never let a read model become the hidden
 * source of truth". A cache you cannot rebuild IS the source of truth, whatever the comments say
 * — one bad write and the only copy of a customer's balance is a number nobody can re-derive.
 * Reconciliation gained BALANCE_DRIFT detection recently; this is the remediation that detection
 * implies. Detecting drift with no way to correct it just tells you to panic.
 *
 * The chain is authoritative. This never invents a figure: it reads what the account actually
 * holds and overwrites the cache. Assets present in the cache but absent on-chain are zeroed
 * rather than left — a stale row for an asset the wallet no longer holds is precisely the drift
 * worth erasing.
 *
 * Usage:
 *   DATABASE_URL=... STELLAR_HORIZON_URL=... npx tsx scripts/rebuild-wallet-balances.ts [--wallet <id>] [--dry-run]
 */
import { createPrismaClient } from '../src/index';
import { loadConfig } from '@paychain/config';
import { StellarProvider } from '@paychain/stellar';

interface Args {
  walletId?: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const walletIdx = argv.indexOf('--wallet');
  return {
    walletId: walletIdx > -1 ? argv[walletIdx + 1] : undefined,
    dryRun: argv.includes('--dry-run'),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = loadConfig();
  const prisma = createPrismaClient(process.env.DATABASE_URL);

  // Read-only use of the provider: no sponsor, no signing. A rebuild must never write on-chain.
  const chain = new StellarProvider({
    network: cfg.STELLAR_NETWORK,
    horizonUrl: cfg.STELLAR_HORIZON_URL,
    networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
  });

  const wallets = await prisma.wallet.findMany({
    where: args.walletId ? { id: args.walletId } : {},
    select: { id: true, tenantId: true, stellarAccountId: true, ownerReference: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`${args.dryRun ? '[dry-run] ' : ''}Rebuilding ${wallets.length} wallet(s) from chain (${cfg.STELLAR_NETWORK})`);

  let rebuilt = 0;
  let corrected = 0;
  let unreachable = 0;

  for (const w of wallets) {
    try {
      const onChain = await chain.getBalance({ publicKey: w.stellarAccountId });
      const existing = await prisma.balanceReadModel.findMany({ where: { walletId: w.id } });
      const seen = new Set<string>();

      for (const b of onChain) {
        const issuerPublicKey = b.issuerPublicKey ?? '';
        const key = `${b.assetCode}|${issuerPublicKey}`;
        seen.add(key);

        const prior = existing.find((e) => e.assetCode === b.assetCode && e.issuerPublicKey === issuerPublicKey);
        // Report what the rebuild CHANGED, not just that it ran: a rebuild that silently corrects
        // a wrong balance hides the fact that something produced a wrong balance.
        if (prior && prior.balance !== b.balance) {
          corrected += 1;
          console.log(`  ${w.ownerReference}: ${b.assetCode} ${prior.balance} -> ${b.balance} (cache was wrong)`);
        }

        if (!args.dryRun) {
          await prisma.balanceReadModel.upsert({
            where: {
              walletId_assetCode_issuerPublicKey: { walletId: w.id, assetCode: b.assetCode, issuerPublicKey },
            },
            update: { balance: b.balance, source: 'stellar' },
            create: {
              tenantId: w.tenantId,
              walletId: w.id,
              assetCode: b.assetCode,
              issuerPublicKey,
              balance: b.balance,
              source: 'stellar',
            },
          });
        }
      }

      // Cached rows the chain does not corroborate: the wallet does not hold this asset. Zero it
      // rather than delete, so the row's history and updatedAt remain visible.
      for (const stale of existing) {
        const key = `${stale.assetCode}|${stale.issuerPublicKey}`;
        if (seen.has(key) || stale.balance === '0') continue;
        corrected += 1;
        console.log(`  ${w.ownerReference}: ${stale.assetCode} ${stale.balance} -> 0 (not held on chain)`);
        if (!args.dryRun) {
          await prisma.balanceReadModel.update({
            where: { id: stale.id },
            data: { balance: '0', source: 'stellar' },
          });
        }
      }

      rebuilt += 1;
    } catch (err) {
      // One unreachable account must not abort the sweep — the same failure mode that made a
      // single malformed hash disable reconciliation entirely.
      unreachable += 1;
      console.error(`  ${w.ownerReference}: FAILED to read chain — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(
    `\n${args.dryRun ? '[dry-run] ' : ''}rebuilt ${rebuilt}/${wallets.length}` +
      ` · ${corrected} balance(s) corrected · ${unreachable} unreachable`,
  );
  if (corrected > 0 && args.dryRun) {
    console.log('Re-run without --dry-run to apply. Investigate WHY the cache drifted before you do.');
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e?.message ?? e);
  process.exit(1);
});
