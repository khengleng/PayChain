import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

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
