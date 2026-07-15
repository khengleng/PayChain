import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth-context';

/**
 * Global exception filter (§26, §41). Maps unexpected errors to a generic 500 so raw
 * provider/DB/SDK internals are never exposed to API clients, while logging the real error
 * (with correlation id) server-side. HttpExceptions keep their intended status/message.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<{ status(code: number): { json(body: unknown): void } }>();
    const req = ctx.getRequest<AuthedRequest>();
    const correlationId = req?.correlationId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(
        typeof body === 'object' ? { ...body, correlationId } : { statusCode: status, message: body, correlationId },
      );
      return;
    }

    // Unknown/unexpected error → do not leak details.
    const message = exception instanceof Error ? exception.message : String(exception);
    this.logger.error(
      JSON.stringify({ level: 'error', msg: 'unhandled exception', error: message, correlationId }),
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Internal server error',
      correlationId,
    });
  }
}
