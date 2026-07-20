type Schema = Record<string, unknown>;
type Parameter = Record<string, unknown>;
type Operation = Record<string, unknown>;

const API_BASE = process.env.PAYCHAIN_PUBLIC_API_URL ?? 'https://api.paychain.cambobia.com';
const DOCS_BASE = process.env.PAYCHAIN_DOCS_URL ?? 'https://docs.paychain.cambobia.com';
const API_PREFIX = '/api/v1';
const TOKEN_URL = `${API_BASE}${API_PREFIX}/oauth/token`;

const SCOPES = {
  'wallet.write': 'Create managed wallets',
  'wallet.read': 'Read wallet details and balances',
  'asset.create': 'Create and activate loyalty assets',
  'asset.read': 'Read assets',
  'asset.issue': 'Issue loyalty value and run earn rules',
  'asset.transfer': 'Transfer and redeem loyalty value',
  'asset.burn': 'Burn loyalty value',
  'transaction.read': 'Read transaction history',
  'transaction.compensate': 'Create business compensations',
  'transaction.approve': 'Approve compensations requiring maker-checker',
  'webhook.manage': 'Manage webhook endpoints',
  'stablecoin.manage': 'Manage stablecoin lifecycle and workflows',
  'stablecoin.read': 'Read stablecoin state and workflow records',
  'stablecoin.approve': 'Approve stablecoin lifecycle gates',
  'stablecoin.earn': 'Award reserve-backed points via the earn mint (auto-approved below the ceiling)',
} as const;

function bearer(scopes: Array<keyof typeof SCOPES> = []): Array<Record<string, string[]>> {
  return [{ oauth2ClientCredentials: scopes as string[] }];
}

function jsonBody(schemaRef: string, required = true): Record<string, unknown> {
  return {
    required,
    content: {
      'application/json': {
        schema: { $ref: schemaRef },
      },
    },
  };
}

function jsonResponse(description: string, schemaRef: string): Record<string, unknown> {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: schemaRef },
      },
    },
  };
}

function arrayResponse(description: string, schemaRef: string): Record<string, unknown> {
  return {
    description,
    content: {
      'application/json': {
        schema: { type: 'array', items: { $ref: schemaRef } },
      },
    },
  };
}

function ref(name: string): Record<string, string> {
  return { $ref: `#/components/schemas/${name}` };
}

const parameters: Record<string, Parameter> = {
  CorrelationId: {
    name: 'X-Correlation-Id',
    in: 'header',
    required: false,
    description: 'Optional caller-supplied correlation id echoed through logs and audit records.',
    schema: { type: 'string', format: 'uuid' },
  },
  IdempotencyKey: {
    name: 'Idempotency-Key',
    in: 'header',
    required: true,
    description: 'Required on replay-safe writes so retries cannot double-apply.',
    schema: { type: 'string', minLength: 1, maxLength: 200 },
  },
  WalletId: {
    name: 'walletId',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  },
  AssetId: {
    name: 'assetId',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  },
  TransactionId: {
    name: 'transactionId',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  },
  CompensationId: {
    name: 'compensationId',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  },
  WebhookId: {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  },
  StablecoinId: {
    name: 'stablecoinId',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  },
  StablecoinWorkflowId: {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
  },
  Limit: {
    name: 'limit',
    in: 'query',
    required: false,
    description: 'Maximum number of rows to return. The API caps this at 200.',
    schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
  },
};

const schemas: Record<string, Schema> = {
  TokenRequest: {
    type: 'object',
    required: ['grant_type', 'client_id', 'client_secret'],
    properties: {
      grant_type: { type: 'string', enum: ['client_credentials'] },
      client_id: { type: 'string', minLength: 1 },
      client_secret: { type: 'string', minLength: 1 },
    },
  },
  TokenResponse: {
    type: 'object',
    required: ['access_token', 'token_type', 'expires_in'],
    properties: {
      access_token: { type: 'string' },
      token_type: { type: 'string', example: 'Bearer' },
      expires_in: { type: 'integer', example: 3600 },
    },
  },
  ErrorResponse: {
    type: 'object',
    required: ['statusCode', 'message'],
    properties: {
      statusCode: { type: 'integer', example: 400 },
      message: {
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
      },
      error: { type: 'string', example: 'Bad Request' },
      correlationId: { type: 'string', format: 'uuid' },
    },
  },
  Wallet: {
    type: 'object',
    required: ['id', 'ownerType', 'ownerReference', 'stellarAccountId', 'status', 'createdAt'],
    properties: {
      id: { type: 'string' },
      ownerType: {
        type: 'string',
        enum: ['CUSTOMER', 'MERCHANT', 'ORGANIZATION', 'TREASURY', 'CAMPAIGN', 'SYSTEM', 'REDEMPTION', 'SETTLEMENT'],
      },
      ownerReference: { type: 'string' },
      stellarAccountId: { type: 'string' },
      status: { type: 'string', example: 'ACTIVE' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateWalletRequest: {
    type: 'object',
    required: ['ownerType', 'ownerReference'],
    properties: {
      ownerType: {
        type: 'string',
        enum: ['CUSTOMER', 'MERCHANT', 'ORGANIZATION', 'TREASURY', 'CAMPAIGN', 'SYSTEM', 'REDEMPTION', 'SETTLEMENT'],
      },
      ownerReference: { type: 'string', minLength: 1, maxLength: 200 },
      externalReference: { type: 'string' },
    },
  },
  Balance: {
    type: 'object',
    required: ['assetCode', 'issuerPublicKey', 'balance', 'updatedAt'],
    properties: {
      assetCode: { type: 'string' },
      issuerPublicKey: { type: 'string', description: 'Empty string for native/no-issuer assets.' },
      balance: { type: 'string' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Asset: {
    type: 'object',
    required: ['id', 'assetCode', 'assetName', 'assetType', 'status', 'issuerPublicKey', 'createdAt'],
    properties: {
      id: { type: 'string' },
      assetCode: { type: 'string' },
      assetName: { type: 'string' },
      assetType: { type: 'string', example: 'LOYALTY_POINT' },
      status: { type: 'string', example: 'ACTIVE' },
      issuerPublicKey: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateAssetRequest: {
    type: 'object',
    required: ['assetCode', 'assetName'],
    properties: {
      assetCode: { type: 'string', pattern: '^[A-Za-z0-9]{1,12}$' },
      assetName: { type: 'string', minLength: 1, maxLength: 200 },
      assetType: { type: 'string', enum: ['LOYALTY_POINT'], default: 'LOYALTY_POINT' },
      expiryPolicy: { type: 'string', enum: ['NONE', 'FIXED', 'ROLLING'], default: 'NONE' },
      expiryDays: { type: 'integer', minimum: 1 },
    },
  },
  IssueRequest: {
    type: 'object',
    required: ['destinationWalletId', 'amount'],
    properties: {
      destinationWalletId: { type: 'string' },
      amount: { type: 'string', example: '100' },
    },
  },
  TransferRequest: {
    type: 'object',
    required: ['sourceWalletId', 'destinationWalletId', 'amount'],
    properties: {
      sourceWalletId: { type: 'string' },
      destinationWalletId: { type: 'string' },
      amount: { type: 'string', example: '25' },
    },
  },
  RedeemRequest: {
    type: 'object',
    required: ['sourceWalletId', 'amount'],
    properties: {
      sourceWalletId: { type: 'string' },
      amount: { type: 'string', example: '25' },
    },
  },
  BurnRequest: {
    type: 'object',
    required: ['walletId', 'amount'],
    properties: {
      walletId: { type: 'string' },
      amount: { type: 'string', example: '25' },
    },
  },
  // Earn awards a caller-computed number of points as a reserve-backed mint. The loyalty platform
  // (PayKH) evaluates its own earn rules from the purchase and passes the resulting `amount`; PayChain
  // mints it through the reserve/trustee/compliance-gated saga. So the shape is the mint shape, not a
  // purchase (spendAmount/currency) — PayChain does not run the merchant's rules engine.
  EarnRequest: {
    type: 'object',
    required: ['destinationWalletId', 'amount'],
    properties: {
      destinationWalletId: { type: 'string', description: 'The customer wallet to receive the points.' },
      amount: { type: 'string', example: '40000', description: 'Points to mint (caller-computed).' },
      fundingReference: { type: 'string', description: 'Reserve funding reference backing this mint.' },
    },
  },
  TransactionRecord: {
    type: 'object',
    required: ['id', 'type', 'status', 'correlationId', 'createdAt'],
    properties: {
      id: { type: 'string' },
      type: { type: 'string' },
      status: { type: 'string' },
      blockchainHash: { type: 'string', nullable: true },
      amount: { type: 'string', nullable: true },
      correlationId: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Transaction: {
    type: 'object',
    required: ['id', 'tenantId', 'type', 'status', 'correlationId', 'createdAt'],
    properties: {
      id: { type: 'string' },
      tenantId: { type: 'string' },
      type: { type: 'string' },
      status: { type: 'string' },
      assetId: { type: 'string', nullable: true },
      sourceWalletId: { type: 'string', nullable: true },
      destinationWalletId: { type: 'string', nullable: true },
      amount: { type: 'string', nullable: true },
      blockchainHash: { type: 'string', nullable: true },
      compensatesTransactionId: { type: 'string', nullable: true },
      businessReason: { type: 'string', nullable: true },
      correlationId: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CompensationRequest: {
    type: 'object',
    required: ['amount', 'reason'],
    properties: {
      amount: { type: 'string', example: '10' },
      reason: {
        type: 'string',
        enum: ['MERCHANT_ERROR', 'REFUND', 'FRAUD', 'DUPLICATE_REWARD', 'CAMPAIGN_CANCELLATION', 'DISPUTE', 'MANUAL_CORRECTION', 'EXPIRY_CORRECTION'],
      },
    },
  },
  Compensation: {
    type: 'object',
    required: ['id', 'status', 'createdAt'],
    properties: {
      id: { type: 'string' },
      status: { type: 'string' },
      amount: { type: 'string', nullable: true },
      reason: { type: 'string', nullable: true },
      compensatesTransactionId: { type: 'string', nullable: true },
      blockchainHash: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  WebhookCreateRequest: {
    type: 'object',
    required: ['url', 'events'],
    properties: {
      url: { type: 'string', format: 'uri' },
      events: { type: 'array', minItems: 1, items: { type: 'string' } },
    },
  },
  WebhookEndpoint: {
    type: 'object',
    required: ['id', 'url', 'events', 'status', 'createdAt'],
    properties: {
      id: { type: 'string' },
      url: { type: 'string', format: 'uri' },
      events: { type: 'array', items: { type: 'string' } },
      status: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  WebhookEndpointWithSecret: {
    allOf: [
      ref('WebhookEndpoint'),
      {
        type: 'object',
        required: ['secret'],
        properties: {
          secret: { type: 'string', description: 'Returned only at create/rotate time.' },
        },
      },
    ],
  },
  Health: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', example: 'ok' },
    },
  },
  HealthReady: {
    type: 'object',
    required: ['status', 'database'],
    properties: {
      status: { type: 'string', enum: ['ok', 'degraded'] },
      database: { type: 'boolean' },
    },
  },
  BlockchainHealth: {
    type: 'object',
    additionalProperties: true,
    description: 'Provider-specific blockchain health response.',
  },
  Stablecoin: {
    type: 'object',
    required: ['id', 'assetId', 'assetCode', 'classification', 'referenceCurrency', 'lifecycleState', 'activationStatus', 'reserveRatioTarget', 'createdAt'],
    properties: {
      id: { type: 'string' },
      assetId: { type: 'string' },
      assetCode: { type: 'string' },
      classification: { type: 'string' },
      referenceCurrency: { type: 'string', enum: ['USD', 'KHR'] },
      lifecycleState: { type: 'string' },
      activationStatus: { type: 'string' },
      reserveRatioTarget: { type: 'string' },
      jurisdiction: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateStablecoinRequest: {
    type: 'object',
    required: ['assetCode', 'assetName', 'classification', 'referenceCurrency'],
    properties: {
      assetCode: { type: 'string', pattern: '^[A-Za-z0-9]{1,12}$' },
      assetName: { type: 'string', minLength: 1, maxLength: 200 },
      classification: { type: 'string', enum: ['FIAT_BACKED_STABLECOIN', 'TOKENIZED_DEPOSIT', 'STABLE_VALUE_CREDIT'] },
      referenceCurrency: { type: 'string', enum: ['USD', 'KHR'] },
      issuerLegalEntity: { type: 'string' },
      jurisdiction: { type: 'string' },
      reserveRatioTarget: { type: 'string', example: '1.0' },
    },
  },
  ApproveStablecoinGateRequest: {
    type: 'object',
    required: ['gate'],
    properties: {
      gate: { type: 'string', enum: ['LEGAL', 'COMPLIANCE', 'TREASURY', 'RESERVE', 'TECHNICAL', 'PILOT'] },
      note: { type: 'string', maxLength: 500 },
    },
  },
  SuspendStablecoinRequest: {
    type: 'object',
    required: ['mode'],
    properties: {
      mode: { type: 'string', enum: ['MINTING_SUSPENDED', 'REDEMPTION_SUSPENDED', 'FULLY_SUSPENDED'] },
    },
  },
  MintRequest: {
    type: 'object',
    required: ['destinationWalletId', 'amount'],
    properties: {
      destinationWalletId: { type: 'string' },
      amount: { type: 'string', example: '1000' },
      fundingReference: { type: 'string' },
    },
  },
  RedemptionRequest: {
    type: 'object',
    required: ['walletId', 'amount', 'bankAccountReference'],
    properties: {
      walletId: { type: 'string' },
      amount: { type: 'string', example: '1000' },
      bankAccountReference: { type: 'string' },
    },
  },
  ConversionQuoteRequest: {
    type: 'object',
    required: ['fromAssetId', 'toAssetId', 'walletId', 'pointsAmount'],
    properties: {
      fromAssetId: { type: 'string' },
      toAssetId: { type: 'string' },
      walletId: { type: 'string' },
      pointsAmount: { type: 'string', example: '500' },
      rate: { type: 'string' },
      spread: { type: 'string' },
      fee: { type: 'string' },
    },
  },
};

function withStandardHeaders(
  operation: Operation,
  opts: { idempotent?: boolean; correlation?: boolean } = {},
): Operation {
  const params = [...(operation.parameters as Parameter[] | undefined ?? [])];
  if (opts.correlation ?? true) params.push({ $ref: '#/components/parameters/CorrelationId' });
  if (opts.idempotent) params.push({ $ref: '#/components/parameters/IdempotencyKey' });
  return { ...operation, parameters: params };
}

const paths: Record<string, Record<string, Operation>> = {
  [`${API_PREFIX}/openapi.json`]: {
    get: {
      tags: ['Docs'],
      operationId: 'getOpenApiContract',
      summary: 'Get the machine-readable OpenAPI contract',
      responses: {
        200: {
          description: 'OpenAPI document',
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
  },
  [`${API_PREFIX}/oauth/token`]: {
    post: {
      tags: ['Auth'],
      operationId: 'issueAccessToken',
      summary: 'Exchange client credentials for a bearer token',
      requestBody: jsonBody('#/components/schemas/TokenRequest'),
      responses: {
        200: jsonResponse('Issued access token', '#/components/schemas/TokenResponse'),
        400: jsonResponse('Validation error', '#/components/schemas/ErrorResponse'),
        401: jsonResponse('Invalid credentials', '#/components/schemas/ErrorResponse'),
      },
    },
  },
  [`${API_PREFIX}/wallets`]: {
    post: withStandardHeaders({
      tags: ['Wallets'],
      operationId: 'createWallet',
      summary: 'Create a managed custodial wallet',
      description: 'Creates the Stellar account and records the wallet under the caller tenant.',
      security: bearer(['wallet.write']),
      requestBody: jsonBody('#/components/schemas/CreateWalletRequest'),
      responses: {
        200: jsonResponse('Created wallet', '#/components/schemas/Wallet'),
        400: jsonResponse('Validation error', '#/components/schemas/ErrorResponse'),
        401: jsonResponse('Unauthorized', '#/components/schemas/ErrorResponse'),
        403: jsonResponse('Missing scope', '#/components/schemas/ErrorResponse'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/wallets/{walletId}`]: {
    get: withStandardHeaders({
      tags: ['Wallets'],
      operationId: 'getWallet',
      summary: 'Get a wallet',
      security: bearer(['wallet.read']),
      parameters: [{ $ref: '#/components/parameters/WalletId' }],
      responses: {
        200: jsonResponse('Wallet', '#/components/schemas/Wallet'),
        404: jsonResponse('Wallet not found', '#/components/schemas/ErrorResponse'),
      },
    }),
  },
  [`${API_PREFIX}/wallets/{walletId}/balances`]: {
    get: withStandardHeaders({
      tags: ['Wallets'],
      operationId: 'listWalletBalances',
      summary: 'List wallet balances',
      description: 'Refreshes the rebuildable balance read model from chain before returning balances.',
      security: bearer(['wallet.read']),
      parameters: [{ $ref: '#/components/parameters/WalletId' }],
      responses: {
        200: arrayResponse('Balances', '#/components/schemas/Balance'),
        404: jsonResponse('Wallet not found', '#/components/schemas/ErrorResponse'),
      },
    }),
  },
  [`${API_PREFIX}/assets`]: {
    get: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'listAssets',
      summary: 'List assets',
      security: bearer(['asset.read']),
      responses: {
        200: arrayResponse('Assets', '#/components/schemas/Asset'),
      },
    }),
    post: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'createAsset',
      summary: 'Create an asset',
      security: bearer(['asset.create']),
      requestBody: jsonBody('#/components/schemas/CreateAssetRequest'),
      responses: {
        200: jsonResponse('Created asset', '#/components/schemas/Asset'),
        409: jsonResponse('Asset code conflict', '#/components/schemas/ErrorResponse'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/assets/{assetId}`]: {
    get: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'getAsset',
      summary: 'Get an asset',
      security: bearer(['asset.read']),
      parameters: [{ $ref: '#/components/parameters/AssetId' }],
      responses: {
        200: jsonResponse('Asset', '#/components/schemas/Asset'),
        404: jsonResponse('Asset not found', '#/components/schemas/ErrorResponse'),
      },
    }),
  },
  [`${API_PREFIX}/assets/{assetId}/activate`]: {
    post: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'activateAsset',
      summary: 'Activate an asset',
      security: bearer(['asset.create']),
      parameters: [{ $ref: '#/components/parameters/AssetId' }],
      responses: {
        200: jsonResponse('Activated asset', '#/components/schemas/Asset'),
      },
    }),
  },
  [`${API_PREFIX}/assets/{assetId}/issue`]: {
    post: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'issueAsset',
      summary: 'Issue loyalty value',
      security: bearer(['asset.issue']),
      parameters: [{ $ref: '#/components/parameters/AssetId' }],
      requestBody: jsonBody('#/components/schemas/IssueRequest'),
      responses: {
        200: jsonResponse('Issued transaction', '#/components/schemas/TransactionRecord'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/assets/{assetId}/transfer`]: {
    post: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'transferAsset',
      summary: 'Transfer loyalty value',
      security: bearer(['asset.transfer']),
      parameters: [{ $ref: '#/components/parameters/AssetId' }],
      requestBody: jsonBody('#/components/schemas/TransferRequest'),
      responses: {
        200: jsonResponse('Transfer transaction', '#/components/schemas/TransactionRecord'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/assets/{assetId}/redeem`]: {
    post: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'redeemAsset',
      summary: 'Redeem loyalty value',
      security: bearer(['asset.transfer']),
      parameters: [{ $ref: '#/components/parameters/AssetId' }],
      requestBody: jsonBody('#/components/schemas/RedeemRequest'),
      responses: {
        200: jsonResponse('Redemption transaction', '#/components/schemas/TransactionRecord'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/assets/{assetId}/burn`]: {
    post: withStandardHeaders({
      tags: ['Assets'],
      operationId: 'burnAsset',
      summary: 'Burn loyalty value',
      security: bearer(['asset.burn']),
      parameters: [{ $ref: '#/components/parameters/AssetId' }],
      requestBody: jsonBody('#/components/schemas/BurnRequest'),
      responses: {
        200: jsonResponse('Burn transaction', '#/components/schemas/TransactionRecord'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/assets/{assetId}/earn`]: {
    post: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'earnAsset',
      summary: 'Award loyalty points as a reserve-backed mint (single call)',
      description:
        'Mints a caller-computed number of points to a customer wallet through the reserve/trustee/' +
        'compliance-gated mint saga. Below STABLECOIN_EARN_AUTO_APPROVE_MAX_AMOUNT it mints without a ' +
        'human checker; at/above it, the mint falls back to maker-checker (returned in APPROVAL_REQUIRED). ' +
        'Returns the mint request; on-chain confirmation completes asynchronously.',
      security: bearer(['stablecoin.earn']),
      parameters: [{ $ref: '#/components/parameters/AssetId' }],
      requestBody: jsonBody('#/components/schemas/EarnRequest'),
      responses: {
        200: {
          description: 'Mint workflow record (status SUBMITTED on success, or APPROVAL_REQUIRED above the ceiling)',
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/transactions`]: {
    get: withStandardHeaders({
      tags: ['Transactions'],
      operationId: 'listTransactions',
      summary: 'List transactions',
      security: bearer(['transaction.read']),
      parameters: [{ $ref: '#/components/parameters/Limit' }],
      responses: {
        200: arrayResponse('Transactions', '#/components/schemas/Transaction'),
      },
    }),
  },
  [`${API_PREFIX}/transactions/{transactionId}`]: {
    get: withStandardHeaders({
      tags: ['Transactions'],
      operationId: 'getTransaction',
      summary: 'Get a transaction',
      security: bearer(['transaction.read']),
      parameters: [{ $ref: '#/components/parameters/TransactionId' }],
      responses: {
        200: jsonResponse('Transaction', '#/components/schemas/Transaction'),
        404: jsonResponse('Transaction not found', '#/components/schemas/ErrorResponse'),
      },
    }),
  },
  [`${API_PREFIX}/transactions/{transactionId}/compensate`]: {
    post: withStandardHeaders({
      tags: ['Transactions'],
      operationId: 'createCompensation',
      summary: 'Create a compensating transaction',
      security: bearer(['transaction.compensate']),
      parameters: [{ $ref: '#/components/parameters/TransactionId' }],
      requestBody: jsonBody('#/components/schemas/CompensationRequest'),
      responses: {
        200: jsonResponse('Compensation record', '#/components/schemas/Compensation'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/transactions/compensations/{compensationId}/approve`]: {
    post: withStandardHeaders({
      tags: ['Transactions'],
      operationId: 'approveCompensation',
      summary: 'Approve a pending compensation',
      security: bearer(['transaction.approve']),
      parameters: [{ $ref: '#/components/parameters/CompensationId' }],
      responses: {
        200: jsonResponse('Approved compensation', '#/components/schemas/Compensation'),
      },
    }),
  },
  [`${API_PREFIX}/webhooks`]: {
    get: withStandardHeaders({
      tags: ['Webhooks'],
      operationId: 'listWebhooks',
      summary: 'List webhook endpoints',
      security: bearer(['webhook.manage']),
      responses: {
        200: arrayResponse('Webhook endpoints', '#/components/schemas/WebhookEndpoint'),
      },
    }),
    post: withStandardHeaders({
      tags: ['Webhooks'],
      operationId: 'createWebhook',
      summary: 'Register a webhook endpoint',
      security: bearer(['webhook.manage']),
      requestBody: jsonBody('#/components/schemas/WebhookCreateRequest'),
      responses: {
        200: jsonResponse('Created endpoint plus one-time secret', '#/components/schemas/WebhookEndpointWithSecret'),
      },
    }),
  },
  [`${API_PREFIX}/webhooks/{id}`]: {
    delete: withStandardHeaders({
      tags: ['Webhooks'],
      operationId: 'disableWebhook',
      summary: 'Disable a webhook endpoint',
      security: bearer(['webhook.manage']),
      parameters: [{ $ref: '#/components/parameters/WebhookId' }],
      responses: {
        204: { description: 'Webhook disabled' },
      },
    }),
  },
  [`${API_PREFIX}/webhooks/{id}/rotate-secret`]: {
    post: withStandardHeaders({
      tags: ['Webhooks'],
      operationId: 'rotateWebhookSecret',
      summary: 'Rotate webhook signing secret',
      security: bearer(['webhook.manage']),
      parameters: [{ $ref: '#/components/parameters/WebhookId' }],
      responses: {
        200: jsonResponse('Endpoint plus new one-time secret', '#/components/schemas/WebhookEndpointWithSecret'),
      },
    }),
  },
  [`${API_PREFIX}/health`]: {
    get: {
      tags: ['Health'],
      operationId: 'getHealth',
      summary: 'Liveness probe',
      responses: {
        200: jsonResponse('API live', '#/components/schemas/Health'),
      },
    },
  },
  [`${API_PREFIX}/health/ready`]: {
    get: {
      tags: ['Health'],
      operationId: 'getReadiness',
      summary: 'Readiness probe',
      responses: {
        200: jsonResponse('Readiness state', '#/components/schemas/HealthReady'),
      },
    },
  },
  [`${API_PREFIX}/health/blockchain`]: {
    get: {
      tags: ['Health'],
      operationId: 'getBlockchainHealth',
      summary: 'Blockchain provider health',
      responses: {
        200: jsonResponse('Blockchain provider state', '#/components/schemas/BlockchainHealth'),
      },
    },
  },
  [`${API_PREFIX}/stablecoins`]: {
    get: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'listStablecoins',
      summary: 'List stablecoins',
      description: 'Stablecoin features are disabled by default until readiness gates pass.',
      security: bearer(['stablecoin.read']),
      responses: {
        200: arrayResponse('Stablecoins', '#/components/schemas/Stablecoin'),
      },
    }),
    post: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'createStablecoin',
      summary: 'Create a stablecoin control-plane record',
      description: 'Feature-flag gated; public issuance remains disabled until readiness gates pass.',
      security: bearer(['stablecoin.manage']),
      requestBody: jsonBody('#/components/schemas/CreateStablecoinRequest'),
      responses: {
        200: jsonResponse('Created stablecoin', '#/components/schemas/Stablecoin'),
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/stablecoins/{stablecoinId}`]: {
    get: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'getStablecoin',
      summary: 'Get a stablecoin',
      security: bearer(['stablecoin.read']),
      parameters: [{ $ref: '#/components/parameters/StablecoinId' }],
      responses: {
        200: jsonResponse('Stablecoin', '#/components/schemas/Stablecoin'),
      },
    }),
  },
  [`${API_PREFIX}/stablecoins/{stablecoinId}/submit-for-review`]: {
    post: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'submitStablecoinForReview',
      summary: 'Submit a stablecoin for review',
      security: bearer(['stablecoin.manage']),
      parameters: [{ $ref: '#/components/parameters/StablecoinId' }],
      responses: {
        200: jsonResponse('Updated stablecoin', '#/components/schemas/Stablecoin'),
      },
    }),
  },
  [`${API_PREFIX}/stablecoins/{stablecoinId}/approve-gate`]: {
    post: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'approveStablecoinGate',
      summary: 'Approve a stablecoin gate',
      security: bearer(['stablecoin.approve']),
      parameters: [{ $ref: '#/components/parameters/StablecoinId' }],
      requestBody: jsonBody('#/components/schemas/ApproveStablecoinGateRequest'),
      responses: {
        200: jsonResponse('Updated stablecoin', '#/components/schemas/Stablecoin'),
      },
    }),
  },
  [`${API_PREFIX}/stablecoins/{stablecoinId}/activate`]: {
    post: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'activateStablecoin',
      summary: 'Activate a stablecoin',
      security: bearer(['stablecoin.approve']),
      parameters: [{ $ref: '#/components/parameters/StablecoinId' }],
      responses: {
        200: jsonResponse('Updated stablecoin', '#/components/schemas/Stablecoin'),
      },
    }),
  },
  [`${API_PREFIX}/stablecoins/{stablecoinId}/suspend`]: {
    post: withStandardHeaders({
      tags: ['Stablecoins'],
      operationId: 'suspendStablecoin',
      summary: 'Suspend stablecoin minting, redemption, or both',
      security: bearer(['stablecoin.manage']),
      parameters: [{ $ref: '#/components/parameters/StablecoinId' }],
      requestBody: jsonBody('#/components/schemas/SuspendStablecoinRequest'),
      responses: {
        200: jsonResponse('Updated stablecoin', '#/components/schemas/Stablecoin'),
      },
    }),
  },
  [`${API_PREFIX}/stablecoins/{id}/mint-requests`]: {
    post: withStandardHeaders({
      tags: ['Stablecoin Workflows'],
      operationId: 'createMintRequest',
      summary: 'Create a mint request',
      security: bearer(['stablecoin.manage']),
      parameters: [{ $ref: '#/components/parameters/StablecoinWorkflowId' }],
      requestBody: jsonBody('#/components/schemas/MintRequest'),
      responses: {
        200: {
          description: 'Mint workflow record',
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/stablecoins/{id}/redemptions`]: {
    post: withStandardHeaders({
      tags: ['Stablecoin Workflows'],
      operationId: 'createRedemptionRequest',
      summary: 'Create a redemption request',
      security: bearer(['stablecoin.manage']),
      parameters: [{ $ref: '#/components/parameters/StablecoinWorkflowId' }],
      requestBody: jsonBody('#/components/schemas/RedemptionRequest'),
      responses: {
        200: {
          description: 'Redemption workflow record',
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
      },
    }, { idempotent: true }),
  },
  [`${API_PREFIX}/conversions/quote`]: {
    post: withStandardHeaders({
      tags: ['Stablecoin Workflows'],
      operationId: 'quoteConversion',
      summary: 'Quote a loyalty to stablecoin conversion',
      security: bearer(['stablecoin.manage']),
      requestBody: jsonBody('#/components/schemas/ConversionQuoteRequest'),
      responses: {
        200: {
          description: 'Conversion quote',
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
      },
    }, { idempotent: true }),
  },
};

export function buildOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'PayChain Public API',
      version: '0.1.0',
      description:
        'Tenant-facing API for loyalty integrations today and stablecoin workflows once readiness gates pass. The TypeScript SDK is published separately; other platforms can integrate directly from this contract.',
    },
    servers: [
      {
        url: API_BASE,
        description: 'Production API base',
      },
    ],
    tags: [
      { name: 'Docs' },
      { name: 'Auth' },
      { name: 'Wallets' },
      { name: 'Assets' },
      { name: 'Transactions' },
      { name: 'Webhooks' },
      { name: 'Health' },
      { name: 'Stablecoins' },
      { name: 'Stablecoin Workflows' },
    ],
    paths,
    components: {
      securitySchemes: {
        oauth2ClientCredentials: {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: TOKEN_URL,
              scopes: SCOPES,
            },
          },
        },
      },
      parameters,
      schemas,
    },
    externalDocs: {
      description: 'Developer portal integration guide',
      url: `${DOCS_BASE}/integration`,
    },
  };
}
