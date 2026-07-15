import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class MintRequestDto {
  @IsString() destinationWalletId!: string;
  @IsString() amount!: string;
  @IsOptional() @IsString() fundingReference?: string;
}

export class RedemptionRequestDto {
  @IsString() walletId!: string;
  @IsString() amount!: string;
  @IsString() bankAccountReference!: string;
}

export class ConversionQuoteDto {
  @IsString() fromAssetId!: string;
  @IsString() toAssetId!: string;
  @IsString() walletId!: string;
  @IsString() pointsAmount!: string;
  @IsOptional() @IsString() rate?: string;
  @IsOptional() @IsString() spread?: string;
  @IsOptional() @IsString() fee?: string;
}

export class ReserveAccountDto {
  @IsString() @MaxLength(200) label!: string;
  @IsOptional() @IsString() custodianReference?: string;
  @IsOptional() @IsString() bankReference?: string;
}

export class TreasuryMovementDto {
  @IsOptional() @IsString() assetId?: string;
  @IsString() fromAccount!: string;
  @IsString() toAccount!: string;
  @IsString() amount!: string;
  @IsString() @MaxLength(200) purpose!: string;
}

export class MonitoringEvaluateDto {
  @IsIn(['wallet', 'transaction']) subjectType!: 'wallet' | 'transaction';
  @IsString() subjectReference!: string;
  @IsOptional() @IsString() amount?: string;
  @IsOptional() @IsString() country?: string;
}
