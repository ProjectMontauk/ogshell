import type { NextApiRequest, NextApiResponse } from "next";
import { getContractsForMarket } from "../../constants/contracts";
import { calculateSharesFromBetAmount } from "../../src/utils/calculateSharesFromBetAmount";
import { getAllowedOrigin } from "../../lib/cors";
import { CASH_TOKEN_SCALE } from "../../constants/tokenUnits";
import { bigintWeiToHumanNumber } from "../../src/utils/fixedPointAmount";

/**
 * One-off test: GET /api/test-shares?amount=100&outcome=0
 * Returns shares receivable for that bet amount (outcome 0 = Yes, 1 = No).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = getAllowedOrigin(req.headers.origin as string | undefined);
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const amount = Math.abs(Number(req.query.amount ?? 100));
  const outcome = Number(req.query.outcome ?? 0) === 1 ? 1 : 0;

  const { conditionalTokensContract, marketContract, outcome1PositionId, outcome2PositionId, outcomeTokenDecimals } =
    getContractsForMarket("jfk");

  const betAmountWei = BigInt(Math.floor(amount * CASH_TOKEN_SCALE));

  try {
    const sharesWei = await calculateSharesFromBetAmount(
      conditionalTokensContract,
      marketContract.address as string,
      outcome1PositionId,
      outcome2PositionId,
      outcome as 0 | 1,
      betAmountWei,
      { outcomeTokenDecimals }
    );
    const sharesHuman = bigintWeiToHumanNumber(sharesWei, outcomeTokenDecimals);
    return res.status(200).json({
      betAmountUsd: amount,
      outcome: outcome === 0 ? "Yes" : "No",
      sharesWei: sharesWei.toString(),
      sharesHuman: Math.round(sharesHuman * 100) / 100,
    });
  } catch (e) {
    console.error("test-shares error:", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
