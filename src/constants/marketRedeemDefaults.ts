export type MarketRedeemDefaults = {
  collateralToken: string;
  parentCollectionId: string;
  conditionId: string;
  defaultIndexSets: string;
};

/** Hardcode `redeemPositions` args per resolved market here (no API). Used when `hideParameterFields` is on. */
export function getMarketRedeemDefaults(marketId: string): MarketRedeemDefaults | null {
  if (marketId === "covid19") {
    // Redeem prefill was tied to the previous deployment. After migrating to
    // `covid19LabLeakConditionalTokensContractAddress`, set `conditionId` (and
    // index sets if needed) from on-chain state and return an object here again.
    return null;
  }
  return null;
}
