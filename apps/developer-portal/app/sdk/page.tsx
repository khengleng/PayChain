const REPO_BASE = 'https://github.com/khengleng/PayChain/tree/main';
const OPENAPI_URL = 'https://api.paychain.cambobia.com/api/v1/openapi.json';

const TYPESCRIPT_INSTALL = `npm install https://github.com/khengleng/PayChain/releases/download/sdk-v0.1.0/paychain-sdk-0.1.0.tgz`;

const OPENAPI_SNIPPET = `curl -O ${OPENAPI_URL}

# Generate your own client with OpenAPI Generator
npx @openapitools/openapi-generator-cli generate \\
  -i openapi.json \\
  -g <your-language> \\
  -o ./paychain-sdk`;

const TYPESCRIPT_SNIPPET = `import { PayChainClient } from '@paychain/sdk';

const client = new PayChainClient({
  baseUrl: 'https://api.paychain.cambobia.com/api/v1',
  clientId: process.env.PAYCHAIN_CLIENT_ID!,
  clientSecret: process.env.PAYCHAIN_CLIENT_SECRET!,
});

const wallet = await client.wallets.create({
  ownerType: 'CUSTOMER',
  ownerReference: 'alice',
});
`;

const SDKS = [
  {
    name: 'TypeScript',
    status: 'Hand-written',
    packagePath: 'packages/sdk-typescript',
    docs: 'OAuth token caching, idempotency helpers, retries, typed errors, webhook verification.',
  },
  {
    name: 'Dart / Flutter',
    status: 'Generated from OpenAPI',
    packagePath: 'packages/sdk-dart',
    docs: 'Dio-based client with generated models and endpoint docs.',
  },
  {
    name: 'PHP',
    status: 'Generated from OpenAPI',
    packagePath: 'packages/sdk-php',
    docs: 'Composer-style package source for server-side integrations.',
  },
  {
    name: 'Kotlin',
    status: 'Generated from OpenAPI',
    packagePath: 'packages/sdk-kotlin',
    docs: 'JVM OkHttp client with generated models and Gradle project.',
  },
  {
    name: '.NET / C#',
    status: 'Generated from OpenAPI',
    packagePath: 'packages/sdk-dotnet',
    docs: 'net8.0 client source with generated API surface and models.',
  },
] as const;

export default function Sdk() {
  return (
    <div className="wrap">
      <h1>SDKs</h1>
      <p className="lead">
        PayChain supports one maintained TypeScript SDK plus generated Dart, PHP, Kotlin, and
        .NET packages from the public OpenAPI contract.
      </p>

      <div className="grid">
        {SDKS.map((sdk) => (
          <a
            key={sdk.name}
            className="card"
            href={`${REPO_BASE}/${sdk.packagePath}`}
            target="_blank"
            rel="noreferrer"
          >
            <h3>{sdk.name}</h3>
            <p>
              <span className="mono">{sdk.status}</span>
            </p>
            <p style={{ marginTop: 8 }}>{sdk.docs}</p>
          </a>
        ))}
      </div>

      <h2>Recommended path</h2>
      <div className="table-wrap">
        <table>
          <tbody>
            <tr>
              <td className="mono" style={{ width: 180 }}>
                JavaScript / Node
              </td>
              <td>Use the TypeScript SDK. It adds auth, retry, idempotency, and webhook helpers.</td>
            </tr>
            <tr>
              <td className="mono">Flutter / Dart</td>
              <td>Use the generated Dart package or regenerate it from the live contract.</td>
            </tr>
            <tr>
              <td className="mono">PHP / Kotlin / .NET</td>
              <td>Use the generated package source in this repo or regenerate from OpenAPI.</td>
            </tr>
            <tr>
              <td className="mono">Any other platform</td>
              <td>
                Generate a client from <a href={OPENAPI_URL}>{OPENAPI_URL}</a>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>TypeScript install</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        The TypeScript SDK is the most complete client today. It is not on the public npm
        registry yet, so install from the current GitHub release tarball.
      </p>
      <pre>
        <code>{TYPESCRIPT_INSTALL}</code>
      </pre>

      <h2>TypeScript example</h2>
      <pre>
        <code>{TYPESCRIPT_SNIPPET}</code>
      </pre>

      <h2>Generate another client</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        The public contract includes stable operation IDs, so generated methods use names like{' '}
        <span className="mono">createWallet</span>, <span className="mono">issueAsset</span>, and{' '}
        <span className="mono">approveCompensation</span> instead of raw route names.
      </p>
      <pre>
        <code>{OPENAPI_SNIPPET}</code>
      </pre>

      <h2>Notes</h2>
      <table style={{ fontSize: 14 }}>
        <tbody>
          <tr>
            <td className="mono" style={{ whiteSpace: 'nowrap', paddingRight: 16 }}>
              OpenAPI
            </td>
            <td>Published at <a href={OPENAPI_URL}>{OPENAPI_URL}</a>.</td>
          </tr>
          <tr>
            <td className="mono" style={{ whiteSpace: 'nowrap', paddingRight: 16 }}>
              Generated SDKs
            </td>
            <td>Current generated packages are committed in this repository under <span className="mono">packages/</span>.</td>
          </tr>
          <tr>
            <td className="mono" style={{ whiteSpace: 'nowrap', paddingRight: 16 }}>
              Validation
            </td>
            <td>Dart and Kotlin are checked locally here. PHP and .NET require their toolchains in CI or downstream environments.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
