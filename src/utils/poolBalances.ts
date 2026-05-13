import { readContract } from "thirdweb";
import { OUTCOME_TOKEN_SCALE_BI } from "../../constants/tokenUnits";

type Contract = Parameters<typeof readContract>[0]["contract"];

const BALANCE_OF_ABI =
  "function balanceOf(address account, uint256 id) view returns (uint256)";

export type OutcomePoolBalancesWei = {
  outcome1Wei: bigint;
  outcome2Wei: bigint;
};

export type OutcomePoolConstantK = {
  outcome1Human: number;
  outcome2Human: number;
  /** K in human units: outcome1Human * outcome2Human (floating-point). */
  kHuman: number;
  /** Exact K in wei^2: outcome1Wei * outcome2Wei. */
  kWeiSquared: bigint;
};

const WEI_PER_TOKEN = OUTCOME_TOKEN_SCALE_BI;

/**
 * Fetches the AMM/market maker's pool balances for two outcome position IDs.
 *
 * This reads the conditional-tokens (ERC-1155) balances where the *owner* is the
 * market maker contract address.
 *
 * @param conditionalTokensContract ERC-1155 Conditional Tokens contract instance
 * @param marketMakerAddress Owner address that holds pool outcome tokens (market contract address)
 * @param outcome1PositionId Position ID for outcome 1 (your "Yes"/index 0 position)
 * @param outcome2PositionId Position ID for outcome 2 (your "No"/index 1 position)
 */
export async function getOutcomePoolBalancesWei(
  conditionalTokensContract: Contract,
  marketMakerAddress: string,
  outcome1PositionId: string,
  outcome2PositionId: string
): Promise<OutcomePoolBalancesWei> {
  const [b1, b2] = await Promise.all([
    readContract({
      contract: conditionalTokensContract,
      method: BALANCE_OF_ABI,
      params: [marketMakerAddress as `0x${string}`, BigInt(outcome1PositionId)],
    }),
    readContract({
      contract: conditionalTokensContract,
      method: BALANCE_OF_ABI,
      params: [marketMakerAddress as `0x${string}`, BigInt(outcome2PositionId)],
    }),
  ]);

  return {
    outcome1Wei: typeof b1 === "bigint" ? b1 : BigInt(b1),
    outcome2Wei: typeof b2 === "bigint" ? b2 : BigInt(b2),
  };
}

/**
 * Fetches pool balances, converts to human units (18 decimals), and computes:
 * K = outcome1Human * outcome2Human.
 *
 * Note: kHuman uses JS number math and can lose precision for very large balances.
 * kWeiSquared is exact.
 */
export async function getOutcomePoolConstantK(
  conditionalTokensContract: Contract,
  marketMakerAddress: string,
  outcome1PositionId: string,
  outcome2PositionId: string
): Promise<OutcomePoolConstantK> {
  const { outcome1Wei, outcome2Wei } = await getOutcomePoolBalancesWei(
    conditionalTokensContract,
    marketMakerAddress,
    outcome1PositionId,
    outcome2PositionId
  );

  const outcome1Human = Number(outcome1Wei) / Number(WEI_PER_TOKEN);
  const outcome2Human = Number(outcome2Wei) / Number(WEI_PER_TOKEN);
  const kHuman = outcome1Human * outcome2Human;
  const kWeiSquared = outcome1Wei * outcome2Wei;

  return { outcome1Human, outcome2Human, kHuman, kWeiSquared };
}

