import { tokenContractAddress } from "../../constants/contracts";

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

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
      collateralToken: tokenContractAddress,
      parentCollectionId: ZERO_BYTES32,
      conditionId:
        "0x5A30B343C2215233B08397CBBE108911F376F4E3741A8EE1EE0083CF994E9D0A",
      defaultIndexSets: "1",
    };
  }
  return null;
}
