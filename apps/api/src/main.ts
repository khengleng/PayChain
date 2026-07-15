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

  // Security headers (§41): CSP, HSTS, no-sniff, frameguard, etc.
  app.use(helmet());
  // Bound request bodies to blunt payload-based DoS (§41).
  app.useBodyParser('json', { limit: '256kb' });

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
    }),
  );
}

void bootstrap();
