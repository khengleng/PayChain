import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

/** Mirrors the TenantStatus enum. */
export class SetTenantStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'CLOSED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}
