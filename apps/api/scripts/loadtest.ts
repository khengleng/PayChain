/**
 * Load-test harness (§40, §0.7). Measures the throughput of PayChain's in-process pipeline
 * (amount validation + provider op) against the MOCK blockchain provider — i.e. the ceiling
 * of our own code with zero network latency. This is reported SEPARATELY from real-network
 * latency (a mock number is never presented as real-network capability, §0.7).
 *
 * Run: TS_NODE_TRANSPILE_ONLY=1 pnpm --filter @paychain/api exec ts-node scripts/loadtest.ts
 * Optional real-testnet single-op latency: REAL=1 ... (requires network + funded sponsor).
 */
import { MockBlockchainProvider } from '@paychain/blockchain';
import { isValidAmount } from '../src/common/money';

interface Result {
  label: string;
  ops: number;
  seconds: number;
  opsPerSec: number;
}

async function measure(label: string, total: number, concurrency: number): Promise<Result> {
  const provider = new MockBlockchainProvider();
  const issuer = await provider.createWallet({ correlationId: 'lt' });
  // Pre-create a pool of destination wallets.
  const dests: string[] = [];
  for (let i = 0; i < 100; i += 1) dests.push((await provider.createWallet({ correlationId: 'lt' })).publicKey);

  // Representative per-op work: validate the amount (as the API does) then submit.
  const oneOp = async (i: number): Promise<void> => {
    const amount = '10';
    if (!isValidAmount(amount)) throw new Error('bad amount');
    await provider.issueAsset({
      correlationId: 'lt',
      assetCode: 'PTS',
      issuerPublicKey: issuer.publicKey,
      issuerSecretKey: issuer.secretKey!,
      destinationPublicKey: dests[i % dests.length]!,
      amount,
    });
  };

  const start = process.hrtime.bigint();
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < total) {
      const i = next++;
      await oneOp(i);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const seconds = Number(process.hrtime.bigint() - start) / 1e9;
  return { label, ops: total, seconds, opsPerSec: Math.round(total / seconds) };
}

async function main(): Promise<void> {
  // Warm up the JIT.
  await measure('warmup', 20_000, 16);

  const results: Result[] = [];
  results.push(await measure('sustained (concurrency 32)', 300_000, 32));
  results.push(await measure('burst (concurrency 128)', 300_000, 128));

   
  console.log(JSON.stringify({ mockPipeline: results, node: process.version, note: 'mock provider — excludes network + DB latency (§0.7)' }, null, 2));
}

void main();
