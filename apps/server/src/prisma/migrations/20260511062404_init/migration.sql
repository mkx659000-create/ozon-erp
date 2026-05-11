-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'DISABLED', 'AUTH_EXPIRED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ON_SALE', 'OUT_OF_STOCK', 'MODERATION', 'MODERATION_FAILED', 'REMOVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PriceRuleType" AS ENUM ('COST_PLUS_PERCENT', 'COST_PLUS_FIXED', 'COMPETITOR_MINUS');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('ACTIVE', 'UPCOMING', 'ENDED');

-- CreateEnum
CREATE TYPE "PromotionParticipationType" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('JOINED', 'NOT_JOINED', 'EXITED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PACKAGING', 'AWAITING_DELIVER', 'DELIVERING', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('PRODUCT', 'PRICE', 'STOCK', 'PROMOTION', 'ORDER', 'CATEGORY', 'ANALYTICS');

-- CreateEnum
CREATE TYPE "SyncLogStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_FAILURE', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_accounts" (
    "id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "ozon_client_id" TEXT NOT NULL,
    "ozon_api_key" TEXT NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_sync_at" TIMESTAMP(3),
    "sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_store_accounts" (
    "user_id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,

    CONSTRAINT "user_store_accounts_pkey" PRIMARY KEY ("user_id","store_account_id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "ozon_product_id" BIGINT NOT NULL,
    "offer_id" TEXT,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "category_id" INTEGER,
    "category_name" TEXT,
    "notes" TEXT,
    "primary_image" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ProductStatus" NOT NULL DEFAULT 'MODERATION',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "selling_price" DECIMAL(12,2),
    "original_price" DECIMAL(12,2),
    "lowest_price" DECIMAL(12,2),
    "cost_price" DECIMAL(12,2),
    "currency_code" TEXT NOT NULL DEFAULT 'RUB',
    "price_index" TEXT,
    "total_stock" INTEGER NOT NULL DEFAULT 0,
    "sales_14d" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "weight_gross" DECIMAL(10,2),
    "dimension_length" DECIMAL(10,2),
    "dimension_width" DECIMAL(10,2),
    "dimension_height" DECIMAL(10,2),
    "volume_weight" DECIMAL(10,2),
    "merge_count" INTEGER NOT NULL DEFAULT 0,
    "merge_number" TEXT,
    "ozon_created_at" TIMESTAMP(3),
    "ozon_updated_at" TIMESTAMP(3),
    "last_modified_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_skus" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ozon_sku" BIGINT NOT NULL,
    "fbo_sku" BIGINT,
    "fbs_sku" BIGINT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_auto_rules" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "rule_type" "PriceRuleType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "min_price" DECIMAL(12,2),
    "max_price" DECIMAL(12,2),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_auto_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "ozon_action_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "participation_type" "PromotionParticipationType" NOT NULL DEFAULT 'MANUAL',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_products" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "participation_status" "ParticipationStatus" NOT NULL DEFAULT 'NOT_JOINED',
    "original_price" DECIMAL(12,2),
    "lowest_promo_price" DECIMAL(12,2),
    "promo_price" DECIMAL(12,2),
    "promo_discount" DECIMAL(5,2),
    "promo_stock" INTEGER,
    "operator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "ozon_posting_number" TEXT NOT NULL,
    "ozon_order_id" BIGINT,
    "order_status" "OrderStatus" NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'RUB',
    "shipping_provider" TEXT,
    "tracking_number" TEXT,
    "customer_name" TEXT,
    "customer_region" TEXT,
    "ozon_created_at" TIMESTAMP(3) NOT NULL,
    "ship_by_date" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "ozon_sku" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "offer_id" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "name" TEXT NOT NULL,
    "name_zh" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "has_children" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "sync_type" "SyncType" NOT NULL,
    "status" "SyncLogStatus" NOT NULL,
    "items_processed" INTEGER NOT NULL DEFAULT 0,
    "items_failed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "products_store_account_id_status_idx" ON "products"("store_account_id", "status");

-- CreateIndex
CREATE INDEX "products_store_account_id_name_idx" ON "products"("store_account_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_account_id_ozon_product_id_key" ON "products"("store_account_id", "ozon_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_skus_product_id_ozon_sku_key" ON "product_skus"("product_id", "ozon_sku");

-- CreateIndex
CREATE INDEX "promotions_store_account_id_status_idx" ON "promotions"("store_account_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_store_account_id_ozon_action_id_key" ON "promotions"("store_account_id", "ozon_action_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_products_promotion_id_product_id_key" ON "promotion_products"("promotion_id", "product_id");

-- CreateIndex
CREATE INDEX "orders_store_account_id_order_status_idx" ON "orders"("store_account_id", "order_status");

-- CreateIndex
CREATE INDEX "orders_ozon_created_at_idx" ON "orders"("ozon_created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_store_account_id_ozon_posting_number_key" ON "orders"("store_account_id", "ozon_posting_number");

-- CreateIndex
CREATE INDEX "sync_logs_store_account_id_sync_type_created_at_idx" ON "sync_logs"("store_account_id", "sync_type", "created_at");

-- CreateIndex
CREATE INDEX "operation_logs_user_id_created_at_idx" ON "operation_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "operation_logs_target_type_target_id_idx" ON "operation_logs"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "user_store_accounts" ADD CONSTRAINT "user_store_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_store_accounts" ADD CONSTRAINT "user_store_accounts_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_auto_rules" ADD CONSTRAINT "price_auto_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
