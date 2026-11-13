export type MarketRedeemDefaults = {
  collateralToken: string;
  parentCollectionId: string;
  conditionId: string;
  defaultIndexSets: string;
};

/** Hardcode `redeemPositions` args per resolved market here (no API). Used when `hideParameterFields` is on. */
export function getMarketRedeemDefaults(marketId: string): MarketRedeemDefaults | null {
  if (marketId === "covid19") {
    return {
      collateralToken: "0xDAB56809ac640587b9d6B744f275118e9D989CB5", // MockUSDC
      parentCollectionId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      conditionId:
        "0x7504a94ebccc82d54b5f63bd375701b005d54f4e9a7c377edd7ad6d626a98177",
      defaultIndexSets: "1,2",
    };
  }
  return null;
}
