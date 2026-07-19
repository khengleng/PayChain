-- Per-coin unit value (denomination) + merchant branding on stablecoin configs.
ALTER TABLE "stablecoin_configs"
ADD COLUMN "unitValue" TEXT NOT NULL DEFAULT '1',
ADD COLUMN "brandLabel" TEXT,
ADD COLUMN "merchantReference" TEXT;
