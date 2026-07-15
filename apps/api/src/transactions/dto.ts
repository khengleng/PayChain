import { IsIn, IsString } from 'class-validator';

// Reason codes for a business reversal (§19).
export const COMPENSATION_REASONS = [
  'MERCHANT_ERROR',
  'REFUND',
  'FRAUD',
  'DUPLICATE_REWARD',
  'CAMPAIGN_CANCELLATION',
  'DISPUTE',
  'MANUAL_CORRECTION',
  'EXPIRY_CORRECTION',
] as const;

export class CompensateDto {
  /** Amount to reverse; must be <= the original's not-yet-compensated amount. */
  @IsString()
  amount!: string;

  @IsIn(COMPENSATION_REASONS)
  reason!: (typeof COMPENSATION_REASONS)[number];
}
