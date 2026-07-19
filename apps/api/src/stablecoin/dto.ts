import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// M3 permits only these classifications to be created. ALGORITHMIC_STABLECOIN and
// ASSET_BACKED_TOKEN are classification labels only — not implemented as products (§1).
const CREATABLE_CLASSIFICATIONS = [
  'FIAT_BACKED_STABLECOIN',
  'TOKENIZED_DEPOSIT',
  'STABLE_VALUE_CREDIT',
] as const;

const REFERENCE_CURRENCIES = ['USD', 'KHR'] as const;

const SUSPEND_MODES = ['MINTING_SUSPENDED', 'REDEMPTION_SUSPENDED', 'FULLY_SUSPENDED'] as const;

const APPROVAL_GATES = ['LEGAL', 'COMPLIANCE', 'TREASURY', 'RESERVE', 'TECHNICAL', 'PILOT'] as const;

export class CreateStablecoinDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{1,12}$/, { message: 'assetCode must be 1-12 alphanumeric chars' })
  assetCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  assetName!: string;

  @IsIn(CREATABLE_CLASSIFICATIONS)
  classification!: (typeof CREATABLE_CLASSIFICATIONS)[number];

  @IsIn(REFERENCE_CURRENCIES)
  referenceCurrency!: (typeof REFERENCE_CURRENCIES)[number];

  @IsOptional()
  @IsString()
  issuerLegalEntity?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  reserveRatioTarget?: string;

  // Value of one coin in referenceCurrency (e.g. "0.01" or "100"). Default "1" (1 coin = 1 unit).
  @IsOptional()
  @Matches(/^\d{1,15}(\.\d{1,7})?$/, { message: 'unitValue must be a positive decimal (max 7 dp)' })
  unitValue?: string;
}

/** One-call provisioning of a branded, unit-valued merchant coin (created in DRAFT, not minting). */
export class ProvisionMerchantCoinDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{1,12}$/, { message: 'assetCode must be 1-12 alphanumeric chars' })
  assetCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  assetName!: string;

  @IsIn(REFERENCE_CURRENCIES)
  referenceCurrency!: (typeof REFERENCE_CURRENCIES)[number];

  @Matches(/^\d{1,15}(\.\d{1,7})?$/, { message: 'unitValue must be a positive decimal (max 7 dp)' })
  unitValue!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brandLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  merchantReference!: string;

  @IsOptional()
  @IsString()
  issuerLegalEntity?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  reserveRatioTarget?: string;
}

export class ApproveGateDto {
  @IsIn(APPROVAL_GATES)
  gate!: (typeof APPROVAL_GATES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdvanceDto {
  @IsString()
  toState!: string;
}

export class SuspendDto {
  @IsIn(SUSPEND_MODES)
  mode!: (typeof SUSPEND_MODES)[number];
}
