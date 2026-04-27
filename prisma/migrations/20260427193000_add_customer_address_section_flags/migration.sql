-- Persist customer edit section toggles for address blocks
ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "commercialAddressEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deliveryAddressEnabled" BOOLEAN NOT NULL DEFAULT false;
