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
  if (marketId === "glp1-sudden-blindness") {
    return {
      collateralToken: "0xDAB56809ac640587b9d6B744f275118e9D989CB5", // MockUSDC
      parentCollectionId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      conditionId:
        "0xb1e20e85d5ef5a2eb838ea41241b7dd1f5c8b813997bb3f5668b2090cc11f6f2",
      defaultIndexSets: "1,2",
    };
  }
  if (marketId === "talarico-flu-absence") {
    return {
      collateralToken: "0xDAB56809ac640587b9d6B744f275118e9D989CB5", // MockUSDC
      parentCollectionId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      conditionId:
        "0x40275b54fa9eb36f606bb83be0580c919dfee331cf210e4675c0620f46ccb452",
      defaultIndexSets: "1,2",
    };
  }
  if (marketId === "autism") {
    return {
      collateralToken: "0xDAB56809ac640587b9d6B744f275118e9D989CB5", // MockUSDC
      parentCollectionId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      conditionId:
        "0x49195f07d76d9c2311f99e89a3ae37ae4f076baa55e2f668c530942a5bec0287",
      defaultIndexSets: "1,2",
    };
  }
  if (marketId === "epstein-intelligence-agent") {
    return {
      collateralToken: "0xDAB56809ac640587b9d6B744f275118e9D989CB5", // MockUSDC
      parentCollectionId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      conditionId:
        "0xa8fae5b74417bd014052c1dcfd7b52955bd8d8a1259086d78214cafd46da4523",
      defaultIndexSets: "1,2",
    };
  }
  return null;
}
