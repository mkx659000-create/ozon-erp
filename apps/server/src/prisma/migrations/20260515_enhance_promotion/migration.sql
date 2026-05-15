-- AlterTable: add missing fields to promotions
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "freeze_date" TIMESTAMP(3);
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "discount_type" TEXT;
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "discount_value" DECIMAL(5,2);
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "potential_products_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "participating_products_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "banned_products_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "order_amount" DECIMAL(12,2);
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "is_participating" BOOLEAN NOT NULL DEFAULT false;
