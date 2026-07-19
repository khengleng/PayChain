import { UnauthorizedException, createParamDecorator, type ExecutionContext } from '@nestjs/common';

/** The authenticated partner, derived from a verified partner JWT and attached by PartnerAuthGuard. */
export interface PartnerContext {
  userId: string;
  email: string;
  applicationId: string;
  tenantId: string | null;
}

export interface PartnerRequest {
  partner?: PartnerContext;
  correlationId: string;
}

export const CurrentPartner = createParamDecorator((_data: unknown, ctx: ExecutionContext): PartnerContext => {
  const req = ctx.switchToHttp().getRequest<PartnerRequest>();
  if (!req.partner) throw new UnauthorizedException('Partner authentication required');
  return req.partner;
});
