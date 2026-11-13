import { getContract, readContract } from "thirdweb";
import { client } from "@/client";
import type { Market } from "@/data/markets";
import { getMockProbs } from "@/data/mockMarketOdds";

import { CASH_TOKEN_DECIMALS, CASH_TOKEN_SCALE_BI } from "../../constants/tokenUnits";
import { appChain, getContractsForMarket } from "../../constants/contracts";
import { bigintWeiToHumanNumber } from "../utils/fixedPointAmount";

/** One USDC (6 decimals) as `investmentAmount` for `calcBuyAmount`. */
const INVESTMENT_AMOUNT = CASH_TOKEN_SCALE_BI;

/** Fixed-point scale used in `odds-history` rows (same as markets UI). */
export const ODDS_HISTORY_FIXED_POINT = Number("18446744073709551616");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
/** Base Sepolia — mainnet FPMM addresses are empty here until redeployed. */
const BASE_SEPOLIA_ID = 84532;

/** Fetch FPMM yes/no probabilities for one market (same logic as homepage + markets/[id] page). */
export async function fetchFpmmProbsForMarket(
  market: Market
): Promise<{ yes: number; no: number } | null> {
  const mock = getMockProbs(market.id);
  const isPlaceholder =
    !market.contractAddress || market.contractAddress.toLowerCase() === ZERO_ADDRESS;
  // Placeholders still use mocks; live Sepolia markets (e.g. covid19) hit the FPMM.
  if (mock && isPlaceholder) {
    return mock;
  }

  try {
    const contract = getContract({
      client,
      chain: appChain,
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
    if (sY <= 0 || sN <= 0) return mock;
    const oddsYesRaw = invHuman / sY;
    const oddsNoRaw = invHuman / sN;
    const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
    const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
    return { yes: probYes, no: probNo };
  } catch (e) {
    console.warn("FPMM odds unavailable for", market.id, "— using mock if present.", e);
    return mock;
  }
}
