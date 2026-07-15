import 'reflect-metadata';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * M0 vertical-slice e2e (§0.1 exit gate): token → create asset → activate → create wallets
 * → issue → transfer → read balances, exercised end-to-end against Stellar testnet.
 *
 * Requires real infrastructure (Postgres + Redis + testnet reachability) and a seeded
 * demo client. It is SKIPPED unless RUN_E2E=1 so unit CI stays hermetic. This is honest
 * per §47 — we do not pretend the slice ran when the infra was not present.
 */
const runE2E = process.env.RUN_E2E === '1';
const d = runE2E ? describe : describe.skip;

d('PayChain M0 vertical slice (testnet)', () => {
  let app: INestApplication;
  let token: string;

  const clientId = process.env.SEED_CLIENT_ID ?? 'demo-client';
  const clientSecret = process.env.SEED_CLIENT_SECRET ?? 'demo-secret';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/v1/oauth/token')
      .send({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret })
      .expect(200);
    token = res.body.access_token;
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  // Every write now requires an Idempotency-Key (M1, §18).
  const idem = (): { 'Idempotency-Key': string } => ({
    'Idempotency-Key': `e2e-${Math.random().toString(36).slice(2)}-${process.hrtime.bigint()}`,
  });

  it('runs the full loyalty flow and reflects balances', async () => {
    const http = request(app.getHttpServer());
    const auth = { Authorization: `Bearer ${token}` };

    const asset = await http
      .post('/api/v1/assets')
      .set(auth)
      .set(idem())
      .send({ assetCode: 'PTS', assetName: 'Loyalty Points' })
      .expect(201);
    const assetId = asset.body.id;

    await http.post(`/api/v1/assets/${assetId}/activate`).set(auth).expect(201);

    const alice = await http
      .post('/api/v1/wallets')
      .set(auth)
      .set(idem())
      .send({ ownerType: 'CUSTOMER', ownerReference: 'alice' })
      .expect(201);
    const bob = await http
      .post('/api/v1/wallets')
      .set(auth)
      .set(idem())
      .send({ ownerType: 'CUSTOMER', ownerReference: 'bob' })
      .expect(201);

    // Register a webhook endpoint (§35) and confirm the signing secret is returned once.
    const webhook = await http
      .post('/api/v1/webhooks')
      .set(auth)
      .send({ url: 'https://example.test/paychain-hook', events: ['asset.issued', 'asset.transferred'] })
      .expect(201);
    expect(webhook.body.secret).toMatch(/^whsec_/);

    await http
      .post(`/api/v1/assets/${assetId}/issue`)
      .set(auth)
      .set(idem())
      .send({ destinationWalletId: alice.body.id, amount: '100' })
      .expect(201);

    // Missing Idempotency-Key on a financial write must be rejected (§18).
    await http
      .post(`/api/v1/assets/${assetId}/issue`)
      .set(auth)
      .send({ destinationWalletId: alice.body.id, amount: '1' })
      .expect(400);

    await http
      .post(`/api/v1/assets/${assetId}/transfer`)
      .set(auth)
      .set(idem())
      .send({ sourceWalletId: alice.body.id, destinationWalletId: bob.body.id, amount: '40' })
      .expect(201);

    const aliceBalances = await http
      .get(`/api/v1/wallets/${alice.body.id}/balances`)
      .set(auth)
      .expect(200);
    const bobBalances = await http
      .get(`/api/v1/wallets/${bob.body.id}/balances`)
      .set(auth)
      .expect(200);

    const alicePts = aliceBalances.body.find((b: { assetCode: string }) => b.assetCode === 'PTS');
    const bobPts = bobBalances.body.find((b: { assetCode: string }) => b.assetCode === 'PTS');
    expect(Number(alicePts.balance)).toBeCloseTo(60);
    expect(Number(bobPts.balance)).toBeCloseTo(40);
  }, 120_000);
});
