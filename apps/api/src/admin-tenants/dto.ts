import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsIn(['DIRECT', 'WHOLESALER', 'RETAILER'])
  type?: 'DIRECT' | 'WHOLESALER' | 'RETAILER';

  @IsOptional()
  @IsUUID()
  parentTenantId?: string;
}

/** Mirrors the TenantStatus enum. */
export class SetTenantStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'CLOSED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}
