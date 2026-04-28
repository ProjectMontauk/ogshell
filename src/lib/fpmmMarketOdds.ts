import { getContract, readContract } from "thirdweb";
import { client } from "@/client";
import { baseSepolia } from "thirdweb/chains";
import type { Market } from "@/data/markets";

const INVESTMENT_AMOUNT = BigInt("1000000000000000000"); // 1e18 for FPMM calcBuyAmount

/** Fixed-point scale used in `odds-history` rows (same as markets UI). */
export const ODDS_HISTORY_FIXED_POINT = Number("18446744073709551616");

/** Fetch FPMM yes/no probabilities for one market (same logic as homepage + markets/[id] page). */
export async function fetchFpmmProbsForMarket(
  market: Market
): Promise<{ yes: number; no: number } | null> {
  try {
    const contract = getContract({
      client,
      chain: baseSepolia,
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
    const inv = Number(INVESTMENT_AMOUNT);
    const sY = Number(sharesYes);
    const sN = Number(sharesNo);
    if (sY <= 0 || sN <= 0) return null;
    const oddsYesRaw = inv / sY;
    const oddsNoRaw = inv / sN;
    const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
    const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
    return { yes: probYes, no: probNo };
  } catch (e) {
    console.error("FPMM odds error for", market.id, e);
    return null;
  }
}
