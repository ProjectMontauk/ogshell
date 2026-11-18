-- CreateTable
CREATE TABLE "AgentResearch" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "marketTitle" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT,
    "agentProbability" DOUBLE PRECISION NOT NULL,
    "marketYesPrice" DOUBLE PRECISION NOT NULL,
    "edge" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentResearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentResearch_marketId_idx" ON "AgentResearch"("marketId");

-- CreateIndex
CREATE INDEX "AgentResearch_createdAt_idx" ON "AgentResearch"("createdAt");

-- CreateIndex
CREATE INDEX "AgentResearch_walletAddress_idx" ON "AgentResearch"("walletAddress");

