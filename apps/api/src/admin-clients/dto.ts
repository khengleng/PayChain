import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class IssueClientDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes!: string[];

  /**
   * Optional label prefix on the generated client id (e.g. "paykh" → paykh_A1b2...). Cosmetic,
   * but it makes a credential identifiable at a glance in logs and audit entries.
   */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{1,16}$/, {
    message: 'clientIdPrefix must be 1-16 chars of lowercase letters, digits or hyphens',
  })
  clientIdPrefix?: string;
}

export class UpdateScopesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes!: string[];
}

/** Mirrors the ApiClientStatus enum — the schema has exactly these two states. */
export class SetClientStatusDto {
  @IsIn(['ACTIVE', 'REVOKED'])
  status!: 'ACTIVE' | 'REVOKED';
}
