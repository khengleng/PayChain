import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ADMIN_STABLECOIN_APPROVAL_GATES = ['LEGAL', 'COMPLIANCE', 'TREASURY', 'RESERVE', 'TECHNICAL', 'PILOT'] as const;
const ADMIN_STABLECOIN_SUSPEND_MODES = ['MINTING_SUSPENDED', 'REDEMPTION_SUSPENDED', 'FULLY_SUSPENDED'] as const;

/** Set a feature flag from the admin console (§36). */
export class SetFlagDto {
  @IsString()
  @MaxLength(120)
  key!: string;

  @IsBoolean()
  enabled!: boolean;

  /** GLOBAL (default) or a tenant id for a per-tenant override. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  scope?: string;
}

export class AdminApproveStablecoinGateDto {
  @IsIn(ADMIN_STABLECOIN_APPROVAL_GATES)
  gate!: (typeof ADMIN_STABLECOIN_APPROVAL_GATES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdminSuspendStablecoinDto {
  @IsIn(ADMIN_STABLECOIN_SUSPEND_MODES)
  mode!: (typeof ADMIN_STABLECOIN_SUSPEND_MODES)[number];
}
