import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { loadConfig } from '@paychain/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const cfg = loadConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const allowedOrigins = new Set(cfg.API_ALLOWED_ORIGINS.map((origin) => origin.replace(/\/+$/, '')));

  // Security headers (§41): CSP, HSTS, no-sniff, frameguard, etc.
  app.use(helmet());
  app.enableCors({
    origin(origin: string | undefined, callback) {
      // Server-to-server calls and curl/postman requests have no browser Origin header.
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.has(normalized)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by PayChain CORS policy`), false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id'],
  });
  // Bound request bodies to blunt payload-based DoS (§41). The verify hook stashes the exact
  // received bytes on req.rawBody so webhook receivers (the trustee events endpoint) can verify
  // an HMAC computed over the raw body rather than a lossy re-serialization of the parsed JSON.
  app.useBodyParser('json', {
    limit: '256kb',
    verify: (req: { rawBody?: Buffer }, _res: unknown, buf: Buffer) => {
      if (buf?.length) req.rawBody = Buffer.from(buf);
    },
  });

  // All routes are versioned under /api/v1 (§33).
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  // Railway (and most PaaS) inject PORT at runtime; fall back to configured API_PORT.
  const port = Number(process.env.PORT) || cfg.API_PORT;
  await app.listen(port, '0.0.0.0');
   
  console.log(
    JSON.stringify({
      level: 'info',
      msg: 'paychain-api listening',
      port,
      network: cfg.STELLAR_NETWORK,
      allowedOrigins: cfg.API_ALLOWED_ORIGINS,
    }),
  );
}

void bootstrap();
