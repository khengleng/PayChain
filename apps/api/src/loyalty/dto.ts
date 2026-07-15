import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EarnDto {
  @IsString()
  walletId!: string;

  /** Decimal string of spend that drives the rules engine. */
  @IsString()
  spendAmount!: string;

  @IsString()
  @MaxLength(8)
  currency!: string;

  @IsOptional()
  @IsString()
  merchantId?: string;
}
