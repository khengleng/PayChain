import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// M0 supports loyalty points only. The enum is the single canonical asset-type set
// (§0.3, §13); other values are rejected until later milestones enable them.
const M0_ASSET_TYPES = ['LOYALTY_POINT'] as const;

export class CreateAssetDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{1,12}$/, { message: 'assetCode must be 1-12 alphanumeric chars' })
  assetCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  assetName!: string;

  @IsOptional()
  @IsIn(M0_ASSET_TYPES)
  assetType?: (typeof M0_ASSET_TYPES)[number];
}

export class IssueDto {
  @IsString()
  destinationWalletId!: string;

  @IsString()
  amount!: string;
}

export class TransferDto {
  @IsString()
  sourceWalletId!: string;

  @IsString()
  destinationWalletId!: string;

  @IsString()
  amount!: string;
}

export class RedeemDto {
  @IsString()
  sourceWalletId!: string;

  @IsString()
  amount!: string;
}

export class BurnDto {
  @IsString()
  walletId!: string;

  @IsString()
  amount!: string;
}
