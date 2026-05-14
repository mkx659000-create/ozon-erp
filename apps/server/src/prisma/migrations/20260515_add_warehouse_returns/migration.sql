-- Add order_type to orders
ALTER TABLE "orders" ADD COLUMN "order_type" TEXT NOT NULL DEFAULT 'FBS';

-- Add RETURNS and WAREHOUSE to SyncType enum
ALTER TYPE "SyncType" ADD VALUE IF NOT EXISTS 'RETURNS';
ALTER TYPE "SyncType" ADD VALUE IF NOT EXISTS 'WAREHOUSE';

-- Create warehouses table
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "ozon_warehouse_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "is_rfbs" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "warehouses_store_account_id_ozon_warehouse_id_key" ON "warehouses"("store_account_id", "ozon_warehouse_id");

ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create returns table
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "ozon_return_id" BIGINT NOT NULL,
    "posting_number" TEXT,
    "return_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ozon_sku" BIGINT,
    "product_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "return_reason" TEXT,
    "return_amount" DECIMAL(12,2),
    "commission" DECIMAL(12,2),
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "returns_store_account_id_ozon_return_id_return_type_key" ON "returns"("store_account_id", "ozon_return_id", "return_type");
CREATE INDEX "returns_store_account_id_status_idx" ON "returns"("store_account_id", "status");
CREATE INDEX "returns_store_account_id_return_type_idx" ON "returns"("store_account_id", "return_type");

ALTER TABLE "returns" ADD CONSTRAINT "returns_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
