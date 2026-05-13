/** Circle USDC on Base mainnet uses 6 decimals. */
export const CASH_TOKEN_DECIMALS = 6;
export const CASH_TOKEN_SCALE = 10 ** CASH_TOKEN_DECIMALS;
export const CASH_TOKEN_SCALE_BI = BigInt(CASH_TOKEN_SCALE);

/**
 * Outcome / position ERC1155 amounts and FPMM outcome-token math use 18-decimal-style scaling
 * (matches pool balances and `calcBuyAmount` share outputs for deployed markets).
 */
export const OUTCOME_TOKEN_DECIMALS = 18;
export const OUTCOME_TOKEN_SCALE = 10 ** OUTCOME_TOKEN_DECIMALS;
export const OUTCOME_TOKEN_SCALE_BI = BigInt(OUTCOME_TOKEN_SCALE);
