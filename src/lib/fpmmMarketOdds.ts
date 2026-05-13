import { getContract, readContract } from "thirdweb";
import { client } from "@/client";
import { base } from "thirdweb/chains";
import type { Market } from "@/data/markets";

import { CASH_TOKEN_DECIMALS, CASH_TOKEN_SCALE_BI } from "../../constants/tokenUnits";
import { getContractsForMarket } from "../../constants/contracts";
import { bigintWeiToHumanNumber } from "../utils/fixedPointAmount";

/** One USDC (6 decimals) as `investmentAmount` for `calcBuyAmount` on Base mainnet. */
const INVESTMENT_AMOUNT = CASH_TOKEN_SCALE_BI;

/** Fixed-point scale used in `odds-history` rows (same as markets UI). */
export const ODDS_HISTORY_FIXED_POINT = Number("18446744073709551616");

/** Fetch FPMM yes/no probabilities for one market (same logic as homepage + markets/[id] page). */
export async function fetchFpmmProbsForMarket(
  market: Market
): Promise<{ yes: number; no: number } | null> {
  try {
    const contract = getContract({
      client,
      chain: base,
      address: market.contractAddress,
    });
    const [sharesYes, sharesNo] = await Promise.all([
      readContract({
        contract,
        method:
          "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
        params: [INVESTMENT_AMOUNT, 0n],
      }),
      readContract({
        contract,
        method:
          "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
        params: [INVESTMENT_AMOUNT, 1n],
      }),
    ]);
    const outcomeTokenDecimals = getContractsForMarket(market.id).outcomeTokenDecimals;
    const invHuman = bigintWeiToHumanNumber(INVESTMENT_AMOUNT, CASH_TOKEN_DECIMALS);
    const sY = bigintWeiToHumanNumber(
      typeof sharesYes === "bigint" ? sharesYes : BigInt(String(sharesYes)),
      outcomeTokenDecimals
    );
    const sN = bigintWeiToHumanNumber(
      typeof sharesNo === "bigint" ? sharesNo : BigInt(String(sharesNo)),
      outcomeTokenDecimals
    );
    if (sY <= 0 || sN <= 0) return null;
    const oddsYesRaw = invHuman / sY;
    const oddsNoRaw = invHuman / sN;
    const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
    const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
    return { yes: probYes, no: probNo };
  } catch (e) {
    console.error("FPMM odds error for", market.id, e);
    return null;
  }
}
