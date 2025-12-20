-- Adjust default order status
ALTER TABLE "Order"
  ALTER COLUMN "status" SET DEFAULT 'payment_pending';

-- Normalize legacy pending statuses
UPDATE "Order"
SET "status" = 'payment_pending'
WHERE "status" = 'pending';
