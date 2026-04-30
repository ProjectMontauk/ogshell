-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "txHash" TEXT,
ADD COLUMN     "tradeType" TEXT NOT NULL DEFAULT 'BUY';

-- CreateIndex
CREATE INDEX "Trade_txHash_idx" ON "Trade"("txHash");

