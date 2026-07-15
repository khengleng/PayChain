import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig } from '@paychain/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const cfg = loadConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

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
  // eslint-disable-next-line no-console
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
