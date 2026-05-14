-- AlterEnum
ALTER TYPE "SyncType" ADD VALUE 'RATING';

-- CreateTable
CREATE TABLE "seller_ratings" (
    "id" TEXT NOT NULL,
    "store_account_id" TEXT NOT NULL,
    "rating_group" TEXT NOT NULL,
    "rating_name" TEXT NOT NULL,
    "current_value" DECIMAL(5,2) NOT NULL,
    "past_value" DECIMAL(5,2) NOT NULL,
    "rating_status" TEXT NOT NULL,
    "penalty" BOOLEAN NOT NULL DEFAULT false,
    "record_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_ratings_store_account_id_rating_group_rating_name_reco_key" ON "seller_ratings"("store_account_id", "rating_group", "rating_name", "record_date");

-- CreateIndex
CREATE INDEX "seller_ratings_store_account_id_record_date_idx" ON "seller_ratings"("store_account_id", "record_date");

-- AddForeignKey
ALTER TABLE "seller_ratings" ADD CONSTRAINT "seller_ratings_store_account_id_fkey" FOREIGN KEY ("store_account_id") REFERENCES "store_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
