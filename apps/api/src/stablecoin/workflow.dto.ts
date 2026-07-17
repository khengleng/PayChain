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

/**
 * Note there is no `approvedBy` here, deliberately: the approver's identity is taken from the
 * authenticated principal on the approve call, never from the requester's payload.
 */
export class ReserveMovementDto {
  @IsString() reserveAccountId!: string;
  @IsIn(['CREDIT', 'DEBIT']) direction!: 'CREDIT' | 'DEBIT';
  @IsString() amount!: string;
  @IsOptional() @IsString() @MaxLength(200) reference?: string;
}

/**
 * Settlement evidence. PayChain cannot move fiat, so recording EXECUTED without a reference
 * would make the terminal state mean "someone clicked a button".
 */
export class ExecuteTreasuryDto {
  @IsString() @MaxLength(200) externalReference!: string;
}

export class RejectMovementDto {
  @IsString() @MaxLength(500) reason!: string;
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
