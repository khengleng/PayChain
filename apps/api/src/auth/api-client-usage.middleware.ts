import { Injectable, type NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthedRequest } from './auth-context';

type RequestWithUsage = AuthedRequest & {
  auth?: {
    apiClientId: string;
    tenantId: string;
  };
  method?: string;
  baseUrl?: string;
  path?: string;
  originalUrl?: string;
  route?: { path?: string };
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class ApiClientUsageMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  use(
    req: RequestWithUsage,
    res: { on(event: 'finish', cb: () => void): void; statusCode?: number },
    next: () => void,
  ): void {
    res.on('finish', () => {
      if (!req.auth?.apiClientId) return;
      void this.record(req, res.statusCode ?? 0);
    });
    next();
  }

  private async record(req: RequestWithUsage, statusCode: number): Promise<void> {
    const now = new Date();
    try {
      await Promise.all([
        this.prisma.apiClientRequestLog.create({
          data: {
            tenantId: req.auth!.tenantId,
            apiClientId: req.auth!.apiClientId,
            method: req.method ?? 'UNKNOWN',
            route: this.routeOf(req),
            statusCode,
            ip: this.ipOf(req),
            userAgent: this.header(req.headers['user-agent']),
            createdAt: now,
          },
        }),
        this.prisma.apiClient.update({
          where: { id: req.auth!.apiClientId },
          data: { lastApiRequestAt: now },
        }),
      ]);
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'warn',
          component: 'api-client-usage',
          msg: 'failed to record api client usage',
          clientId: req.auth!.apiClientId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }

  private routeOf(req: RequestWithUsage): string {
    const raw = `${req.baseUrl ?? ''}${req.route?.path ?? req.path ?? req.originalUrl ?? ''}`;
    return raw.split('?')[0] || 'unknown';
  }

  private ipOf(req: RequestWithUsage): string | null {
    const forwarded = this.header(req.headers['x-forwarded-for']);
    if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
    return req.ip ?? null;
  }

  private header(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }
}
