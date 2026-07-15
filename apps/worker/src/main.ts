import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { loadConfig } from '@paychain/config';
import { createPrismaClient } from '@paychain/database';
import { SymmetricCrypto } from '@paychain/security';
import { createChainProvider } from './chain';
import { ConfirmationService } from './services/confirmation.service';
import { ReconciliationService } from './services/reconciliation.service';
import { WebhookDeliveryService, type HttpPost } from './services/webhook-delivery.service';
import { ExpiryService } from './services/expiry.service';

const QUEUE = 'paychain-jobs';

function log(msg: string, extra: Record<string, unknown> = {}): void {
   
  console.log(JSON.stringify({ level: 'info', component: 'worker', msg, ...extra }));
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const connection = new IORedis(cfg.REDIS_URL, { maxRetriesPerRequest: null });
  const prisma = createPrismaClient();
  const chain = createChainProvider(cfg);
  const crypto = new SymmetricCrypto(cfg.KEY_ENCRYPTION_KEY);

  const confirmation = new ConfirmationService(prisma as never, chain);
  const reconciliation = new ReconciliationService(prisma as never, chain);
  const httpPost: HttpPost = async (url, body, headers) => {
    const res = await fetch(url, { method: 'POST', body, headers });
    return { status: res.status };
  };
  const delivery = new WebhookDeliveryService(prisma as never, crypto, httpPost);
  const expiry = new ExpiryService(prisma as never, chain, crypto);

  // Schedule the background jobs (§17 confirmation, §35 delivery, §31 reconciliation, §21 expiry).
  const queue = new Queue(QUEUE, { connection });
  await queue.add('confirm', {}, { repeat: { every: 10_000 }, jobId: 'confirm' });
  await queue.add('deliver-webhooks', {}, { repeat: { every: 10_000 }, jobId: 'deliver-webhooks' });
  await queue.add('reconcile', {}, { repeat: { every: 60_000 }, jobId: 'reconcile' });
  await queue.add('expire', {}, { repeat: { every: 900_000 }, jobId: 'expire' });

  const worker = new Worker(
    QUEUE,
    async (job: Job) => {
      switch (job.name) {
        case 'confirm':
          return confirmation.processPending();
        case 'deliver-webhooks':
          return delivery.processPending();
        case 'reconcile':
          return reconciliation.run();
        case 'expire':
          return expiry.processExpired(new Date());
        default:
          return undefined;
      }
    },
    { connection, concurrency: 4 },
  );

  worker.on('completed', (job, result) => {
    if (result && typeof result === 'object' && Object.keys(result).length > 0) {
      log('job completed', { job: job.name, result });
    }
  });
  worker.on('failed', (job, err) => {
     
    console.error(JSON.stringify({ level: 'error', component: 'worker', job: job?.name, error: err.message }));
  });

  log('paychain-worker started', { network: cfg.STELLAR_NETWORK });

  const shutdown = async (): Promise<void> => {
    log('shutting down');
    await worker.close();
    await queue.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

void main().catch((err) => {
   
  console.error(JSON.stringify({ level: 'fatal', component: 'worker', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
