import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const OWNER_TYPES = [
  'CUSTOMER',
  'MERCHANT',
  'ORGANIZATION',
  'TREASURY',
  'CAMPAIGN',
  'SYSTEM',
  'REDEMPTION',
  'SETTLEMENT',
] as const;

export class CreateWalletDto {
  @IsIn(OWNER_TYPES)
  ownerType!: (typeof OWNER_TYPES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  ownerReference!: string;

  @IsOptional()
  @IsString()
  externalReference?: string;
}
