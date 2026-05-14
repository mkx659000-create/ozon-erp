-- CreateTable
CREATE TABLE "finance_transactions" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "operation_id" BIGINT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "operation_date" TIMESTAMP(3) NOT NULL,
    "posting_number" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "commission_amount" DECIMAL(12,2),
    "delivery_charge" DECIMAL(12,2),
    "accruals" DECIMAL(12,2),
    "ozon_sku" BIGINT,
    "product_name" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_summaries" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_sales" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_commissions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_delivery" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_returns" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_payout" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "transaction_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_transactions_store_account_id_operation_id_key" ON "finance_transactions"("store_account_id", "operation_id");

-- CreateIndex
CREATE INDEX "finance_transactions_store_account_id_operation_date_idx" ON "finance_transactions"("store_account_id", "operation_date");

-- CreateIndex
CREATE INDEX "finance_transactions_store_account_id_operation_type_idx" ON "finance_transactions"("store_account_id", "operation_type");

-- CreateIndex
CREATE UNIQUE INDEX "finance_summaries_store_account_id_date_key" ON "finance_summaries"("store_account_id", "date");

-- AddForeignKey
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_summaries" ADD CONSTRAINT "finance_summaries_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
