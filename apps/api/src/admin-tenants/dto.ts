import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, Max, MinLength } from 'class-validator';

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

export class CreateRetailerTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class UpdateTenantPolicyDto {
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(5000)
  requestsPerMinuteLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  writeRequestsPerMinuteLimit?: number;

  @IsOptional()
  @IsBoolean()
  inheritFromParent?: boolean;
}

/** Mirrors the TenantStatus enum. */
export class SetTenantStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'CLOSED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
}
