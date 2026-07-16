import { IsEmail, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const ROLES = [
  'SUPER_ADMIN',
  'SECURITY_ADMIN',
  'OPERATIONS_ADMIN',
  'COMPLIANCE_ADMIN',
  'TREASURY_ADMIN',
  'SUPPORT_ADMIN',
  'AUDITOR',
] as const;
const STATUSES = ['ACTIVE', 'DISABLED'] as const;

export class CreateAdminDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @IsIn(ROLES)
  role!: (typeof ROLES)[number];

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class UpdateAdminDto {
  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
