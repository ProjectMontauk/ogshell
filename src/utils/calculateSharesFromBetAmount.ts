import { readContract } from "thirdweb";
import {
  CASH_TOKEN_DECIMALS,
  OUTCOME_TOKEN_DECIMALS,
} from "../../constants/tokenUnits";
import { bigintWeiToHumanNumber } from "./fixedPointAmount";

type Contract = Parameters<typeof readContract>[0]["contract"];

const BALANCE_OF_ABI =
  "function balanceOf(address account, uint256 id) view returns (uint256)";

/** Default LMSR liquidity parameter (b) from market docs; can be overridden per market. */
export const DEFAULT_LIQUIDITY_B = 10000;

const CASH_SCALE = 10 ** CASH_TOKEN_DECIMALS;

export type CalculateSharesFromBetAmountOptions = {
  liquidityB?: number;
  /** ERC1155 / outcome token fixed-point decimals (e.g. 6 for some markets, 18 default). */
  outcomeTokenDecimals?: number;
};

/**
 * Fetches the AMM pool's outcome token balances from the conditional tokens contract.
 * The market contract is the owner of the pool's outcome tokens.
 *
 * @returns [balanceYesWei, balanceNoWei] for outcome 0 (Yes) and 1 (No).
 */
async function getPoolBalancesWei(
  conditionalTokensContract: Contract,
  marketContractAddress: string,
  outcome1PositionId: string,
  outcome2PositionId: string
): Promise<[bigint, bigint]> {
  const [balance0, balance1] = await Promise.all([
    readContract({
      contract: conditionalTokensContract,
      method: BALANCE_OF_ABI,
      params: [marketContractAddress as `0x${string}`, BigInt(outcome1PositionId)],
    }),
    readContract({
      contract: conditionalTokensContract,
      method: BALANCE_OF_ABI,
      params: [marketContractAddress as `0x${string}`, BigInt(outcome2PositionId)],
    }),
  ]);
  const b0 = typeof balance0 === "bigint" ? balance0 : BigInt(balance0);
  const b1 = typeof balance1 === "bigint" ? balance1 : BigInt(balance1);
  return [b0, b1];
}

/**
 * Computes shares receivable for a given outcome and bet amount using LMSR.
 * Uses pool balances from the conditional tokens contract (no calculateSharesFromBetAmount on market contract).
 *
 * LMSR: cost increase = b * ln( (e^((q_i+x)/b) + sum_{j!=i} e^(q_j/b)) / (sum_j e^(q_j/b)) ).
 * Solving for x: x = b * ln( S*(e^(betAmount/b) - 1) + e^(q_i/b) ) - q_i,
 * where S = sum_j e^(q_j/b). Pool state uses q_i = -balance_i (same sign convention as calcMarginalPrice).
 *
 * @param betAmountWei - Bet amount in USDC base units (6 decimals on Base mainnet).
 * @returns Outcome-token amount in the market's `outcomeTokenDecimals` fixed point.
 */
export async function calculateSharesFromBetAmount(
  conditionalTokensContract: Contract,
  marketContractAddress: string,
  outcome1PositionId: string,
  outcome2PositionId: string,
  outcome: 0 | 1,
  betAmountWei: bigint,
  options?: CalculateSharesFromBetAmountOptions
): Promise<bigint> {
  const liquidityB = options?.liquidityB ?? DEFAULT_LIQUIDITY_B;
  const outcomeDecimals = options?.outcomeTokenDecimals ?? OUTCOME_TOKEN_DECIMALS;
  const outcomeScale = 10 ** outcomeDecimals;

  const [balance0Wei, balance1Wei] = await getPoolBalancesWei(
    conditionalTokensContract,
    marketContractAddress,
    outcome1PositionId,
    outcome2PositionId
  );

  const q0 = -bigintWeiToHumanNumber(balance0Wei, outcomeDecimals);
  const q1 = -bigintWeiToHumanNumber(balance1Wei, outcomeDecimals);
  const b = liquidityB;
  const betAmountHuman = Number(betAmountWei) / CASH_SCALE;

  if (betAmountHuman <= 0 || !Number.isFinite(betAmountHuman)) {
    return 0n;
  }

  const expQ0 = Math.exp(q0 / b);
  const expQ1 = Math.exp(q1 / b);
  const S = expQ0 + expQ1;

  const expBetOverB = Math.exp(betAmountHuman / b);
  const inner =
    outcome === 0
      ? S * (expBetOverB - 1) + expQ0
      : S * (expBetOverB - 1) + expQ1;
  const qOutcome = outcome === 0 ? q0 : q1;

  if (inner <= 0 || !Number.isFinite(inner)) {
    return 0n;
  }

  const xHuman = b * Math.log(inner) - qOutcome;
  if (xHuman < 0 || !Number.isFinite(xHuman)) {
    return 0n;
  }

  return BigInt(Math.floor(xHuman * outcomeScale));
}

/**
 * Convenience: bet amount in human units (USD), returns shares in human units.
 * Apply any discount (e.g. 0.99) before passing if needed.
 */
export async function getSharesFromBetAmountHuman(
  conditionalTokensContract: Contract,
  marketContractAddress: string,
  outcome1PositionId: string,
  outcome2PositionId: string,
  outcome: 0 | 1,
  betAmountHuman: number,
  liquidityB?: number,
  options?: CalculateSharesFromBetAmountOptions
): Promise<number> {
  const betAmountWei = BigInt(Math.floor(betAmountHuman * CASH_SCALE));
  const sharesWei = await calculateSharesFromBetAmount(
    conditionalTokensContract,
    marketContractAddress,
    outcome1PositionId,
    outcome2PositionId,
    outcome,
    betAmountWei,
    { liquidityB, ...options }
  );
  const outcomeDecimals = options?.outcomeTokenDecimals ?? OUTCOME_TOKEN_DECIMALS;
  return bigintWeiToHumanNumber(sharesWei, outcomeDecimals);
}
