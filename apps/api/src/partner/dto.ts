import { IsEmail, IsEmpty, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export const PARTNER_INTEGRATION_TYPES = ['LOYALTY', 'TRUSTEE', 'WHOLESALER', 'RETAILER'] as const;

export class RegisterPartnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  orgName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  contactName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  @MaxLength(200)
  password!: string;

  @IsIn(PARTNER_INTEGRATION_TYPES)
  integrationType!: (typeof PARTNER_INTEGRATION_TYPES)[number];

  @IsOptional()
  @IsUUID()
  requestedParentTenantId?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  useCase!: string;

  /** Honeypot: real users never fill this hidden field; bots do → 400. */
  @IsOptional()
  @IsEmpty()
  website?: string;
}

export class LoginPartnerDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RejectPartnerDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
