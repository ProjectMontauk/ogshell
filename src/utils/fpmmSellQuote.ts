import { sqrtBigInt } from "./bigintMath";

export type PoolBalancesWei = {
  outcome1Wei: bigint;
  outcome2Wei: bigint;
};

export type FpmmSellQuoteParams = {
  /** Current pool balance for outcome 1 (position 1 / index 0), in wei. */
  outcome1Wei: bigint;
  /** Current pool balance for outcome 2 (position 2 / index 1), in wei. */
  outcome2Wei: bigint;
  /** Shares (outcome tokens) the user intends to sell, in wei. */
  sharesToSellWei: bigint;
  /** 0 = outcome1/Yes, 1 = outcome2/No */
  outcomeIndex: 0 | 1;
  /**
   * Optional fee in basis points applied to the *collateral out* quote.
   * If your contract applies fees differently, keep this at 0 and rely on on-chain quoting.
   */
  feeBps?: bigint;
};

export type FpmmSellQuoteResult = {
  /** Quoted collateral returned (wei), before any UI-side slippage buffer. */
  collateralOutWei: bigint;
  /** Discriminant used for the quadratic (wei^2). */
  discriminant: bigint;
  /** floor(sqrt(discriminant)) */
  sqrtDiscriminant: bigint;
};

const BPS_DENOM = 10000n;

/**
 * Quotes collateral out for selling shares into a 2-outcome constant-product FPMM,
 * using only bigint math.
 *
 * Model:
 * - Pool balances are x (outcome1) and y (outcome2)
 * - Selling d shares of outcome i adds d to that outcome balance
 * - Withdrawing z collateral reduces both outcome balances by z
 *
 * For outcome1 sells: (x + d - z) * (y - z) = x * y
 * For outcome2 sells: (x - z) * (y + d - z) = x * y
 *
 * Solves the quadratic and returns the smaller positive root:
 *   z = (S - sqrt(S^2 - 4C)) / 2
 *
 * Where:
 *   S = x + y + d
 *   C = d*y (if selling outcome1) OR d*x (if selling outcome2)
 *
 * Notes:
 * - This ignores contract-specific fees/rounding unless you pass feeBps (simple post-multiplier).
 * - If your on-chain `calcSellAmount`/`sell` logic differs, prefer on-chain quoting for truth.
 */
export function quoteCollateralOutWeiForSellShares(params: FpmmSellQuoteParams): FpmmSellQuoteResult {
  const { outcome1Wei: x, outcome2Wei: y, sharesToSellWei: d, outcomeIndex } = params;
  const feeBps = params.feeBps ?? 0n;

  if (x < 0n || y < 0n || d < 0n) throw new Error("quoteCollateralOutWeiForSellShares: inputs must be >= 0");
  if (d === 0n) return { collateralOutWei: 0n, discriminant: 0n, sqrtDiscriminant: 0n };
  if (feeBps < 0n || feeBps >= BPS_DENOM) throw new Error("quoteCollateralOutWeiForSellShares: feeBps out of range");

  const S = x + y + d;
  const C = outcomeIndex === 0 ? d * y : d * x;

  // disc = S^2 - 4C
  const disc = S * S - 4n * C;
  if (disc < 0n) {
    // Shouldn't happen for valid non-negative balances in this model, but guard anyway.
    return { collateralOutWei: 0n, discriminant: disc, sqrtDiscriminant: 0n };
  }

  const sqrtDisc = sqrtBigInt(disc);
  let z = (S - sqrtDisc) / 2n; // smaller root
  if (z < 0n) z = 0n;

  // Apply optional fee as a simple post-multiplier on collateral out.
  if (feeBps > 0n) {
    z = (z * (BPS_DENOM - feeBps)) / BPS_DENOM;
  }

  // Clamp so we never quote more than the limiting pool balance.
  if (z > x + (outcomeIndex === 0 ? d : 0n)) z = x + (outcomeIndex === 0 ? d : 0n);
  if (z > y + (outcomeIndex === 1 ? d : 0n)) z = y + (outcomeIndex === 1 ? d : 0n);

  return { collateralOutWei: z, discriminant: disc, sqrtDiscriminant: sqrtDisc };
}

/**
 * Convenience: quote collateral out for selling ALL shares for the selected outcome.
 */
export function quoteCollateralOutWeiForSellAll(
  pool: PoolBalancesWei,
  ownedSharesWei: bigint,
  outcomeIndex: 0 | 1,
  feeBps?: bigint
): bigint {
  return quoteCollateralOutWeiForSellShares({
    outcome1Wei: pool.outcome1Wei,
    outcome2Wei: pool.outcome2Wei,
    sharesToSellWei: ownedSharesWei,
    outcomeIndex,
    feeBps,
  }).collateralOutWei;
}

