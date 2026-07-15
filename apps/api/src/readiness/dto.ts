import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const READINESS_STATUSES = ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'WAIVED'] as const;

const EMERGENCY_ACTIONS = [
  'SUSPEND_MINTING',
  'SUSPEND_REDEMPTION',
  'SUSPEND_CONVERSION',
  'SUSPEND_TRANSFERS',
  'FREEZE_WALLET',
  'FREEZE_ASSET',
  'DISABLE_TENANT',
  'DISABLE_MAINNET_WRITES',
] as const;

export class SetGateDto {
  @IsIn(READINESS_STATUSES)
  status!: (typeof READINESS_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  evidence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class EmergencyActionDto {
  @IsIn(EMERGENCY_ACTIONS)
  action!: (typeof EMERGENCY_ACTIONS)[number];

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
