/**
 * Shared portfolio valuation (cash + positions at mark) for Navbar and Portfolio page.
 * RPC runs only when callers invoke these — no timers or polling.
 */
import { readContract } from "thirdweb";
import { getContractsForMarket, tokenContract } from "../../constants/contracts";
import { getAllMarkets } from "../data/markets";
import {
  CASH_TOKEN_DECIMALS,
  CASH_TOKEN_SCALE_BI,
  OUTCOME_TOKEN_DECIMALS,
} from "../../constants/tokenUnits";
import { bigintWeiToHumanNumber } from "./fixedPointAmount";

type MarketContract = Parameters<typeof readContract>[0]["contract"];

/** One USDC in base units for FPMM `calcBuyAmount` reference odds. */
const FPMM_INVESTMENT_WEI = CASH_TOKEN_SCALE_BI;

async function readOutcomeOddsFpmm(
  marketContract: MarketContract,
  outcomeTokenDecimals: number
): Promise<{ oddsYes: bigint; oddsNo: bigint } | null> {
  try {
    const [sharesYes, sharesNo] = await Promise.all([
      readContract({
        contract: marketContract,
        method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
        params: [FPMM_INVESTMENT_WEI, 0n],
      }),
      readContract({
        contract: marketContract,
        method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
        params: [FPMM_INVESTMENT_WEI, 1n],
      }),
    ]);
    const invHuman = bigintWeiToHumanNumber(FPMM_INVESTMENT_WEI, CASH_TOKEN_DECIMALS);
    const sY = bigintWeiToHumanNumber(
      typeof sharesYes === "bigint" ? sharesYes : BigInt(String(sharesYes)),
      outcomeTokenDecimals
    );
    const sN = bigintWeiToHumanNumber(
      typeof sharesNo === "bigint" ? sharesNo : BigInt(String(sharesNo)),
      outcomeTokenDecimals
    );
    if (sY <= 0 || sN <= 0 || !Number.isFinite(sY) || !Number.isFinite(sN)) return null;
    const oddsYesRaw = invHuman / sY;
    const oddsNoRaw = invHuman / sN;
    const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
    const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
    return {
      oddsYes: BigInt(Math.round(probYes * 2 ** 64)),
      oddsNo: BigInt(Math.round(probNo * 2 ** 64)),
    };
  } catch {
    return null;
  }
}

async function readOutcomeOddsLmsr(marketContract: MarketContract): Promise<{ oddsYes: bigint; oddsNo: bigint } | null> {
  try {
    const oddsYes = await readContract({
      contract: marketContract,
      method: "function calcMarginalPrice(uint8 outcomeTokenIndex) view returns (uint256)",
      params: [0],
    });
    const oddsNo = await readContract({
      contract: marketContract,
      method: "function calcMarginalPrice(uint8 outcomeTokenIndex) view returns (uint256)",
      params: [1],
    });
    return { oddsYes: BigInt(oddsYes as bigint), oddsNo: BigInt(oddsNo as bigint) };
  } catch {
    return null;
  }
}

async function readOutcomeOddsLmsrUint256(marketContract: MarketContract): Promise<{ oddsYes: bigint; oddsNo: bigint } | null> {
  try {
    const oddsYes = await readContract({
      contract: marketContract,
      method: "function calcMarginalPrice(uint256 _outcome) view returns (uint256)",
      params: [0n],
    });
    const oddsNo = await readContract({
      contract: marketContract,
      method: "function calcMarginalPrice(uint256 _outcome) view returns (uint256)",
      params: [1n],
    });
    return { oddsYes: BigInt(oddsYes as bigint), oddsNo: BigInt(oddsNo as bigint) };
  } catch {
    return null;
  }
}

/** FPMM or LMSR implied odds scaled to same 2^64 convention as Portfolio page */
export async function readOutcomeOddsForMarket(
  marketContract: MarketContract,
  outcomeTokenDecimals: number = OUTCOME_TOKEN_DECIMALS
): Promise<{ oddsYes: bigint; oddsNo: bigint } | null> {
  const fpmm = await readOutcomeOddsFpmm(marketContract, outcomeTokenDecimals);
  if (fpmm) return fpmm;
  const lmsr8 = await readOutcomeOddsLmsr(marketContract);
  if (lmsr8) return lmsr8;
  return readOutcomeOddsLmsrUint256(marketContract);
}

export async function getCashBalanceUsd(walletAddress: `0x${string}`): Promise<number> {
  const balance = await readContract({
    contract: tokenContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [walletAddress],
  });
  return bigintWeiToHumanNumber(balance as bigint, CASH_TOKEN_DECIMALS);
}

/**
 * Sum of (shares × current mark price) across all markets where user holds ≥0.01 shares.
 * Matches "Bet Value" on the Portfolio page.
 */
export async function getTotalBetValueUsd(walletAddress: `0x${string}`): Promise<number> {
  const markets = getAllMarkets();
  let sum = 0;

  for (const market of markets) {
    try {
      const { conditionalTokensContract, outcome1PositionId, outcome2PositionId, marketContract, outcomeTokenDecimals } =
        getContractsForMarket(market.id);

      const [yesBalance, noBalance, odds] = await Promise.all([
        readContract({
          contract: conditionalTokensContract,
          method: "function balanceOf(address account, uint256 id) view returns (uint256)",
          params: [walletAddress, BigInt(outcome1PositionId)],
        }),
        readContract({
          contract: conditionalTokensContract,
          method: "function balanceOf(address account, uint256 id) view returns (uint256)",
          params: [walletAddress, BigInt(outcome2PositionId)],
        }),
        readOutcomeOddsForMarket(marketContract, outcomeTokenDecimals),
      ]);

      if (!odds) continue;

      const yesShares = bigintWeiToHumanNumber(
        typeof yesBalance === "bigint" ? yesBalance : BigInt(String(yesBalance)),
        outcomeTokenDecimals
      );
      const noShares = bigintWeiToHumanNumber(
        typeof noBalance === "bigint" ? noBalance : BigInt(String(noBalance)),
        outcomeTokenDecimals
      );
      const currentPriceYes = Number(odds.oddsYes) / Math.pow(2, 64);
      const currentPriceNo = Number(odds.oddsNo) / Math.pow(2, 64);

      if (yesShares >= 0.01) sum += yesShares * currentPriceYes;
      if (noShares >= 0.01) sum += noShares * currentPriceNo;
    } catch (e) {
      console.warn(`[portfolioTotals] skip market ${market.id}:`, e);
    }
  }

  return sum;
}
