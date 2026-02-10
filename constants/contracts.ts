import { client } from "../src/client";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

// CIA / JFK Market on Base Sepolia
export const marketContractAddress = "0x3010D5d9C567763Fa90399BE5C82fA02a5a9295F";
export const tokenContractAddress = "0x7874Fea8563cdA853a0DaBF54B7e8E770F726dDb"; // Cash token on Base Sepolia
export const conditionalTokensContractAddress = "0x9Db5368F8194c01eC668831F9fD9000D8aa73406"; // Conditional Tokens Contract on Base Sepolia

// Moon Landing Market Contracts
export const moonLandingMarketContractAddress = "0xeeaca4019f25e573c33a0de266ba0d1020932cc9"; // Moon Landing Market Contract on Base
export const moonLandingConditionalTokensContractAddress = "0x7dFb064Ae49f5A7101C387717f1CDb1b4f2DF7d3"; // Moon Landing Conditional Tokens Contract on Base

// Fluoridation IQ Market Contracts
export const fluoridationIqMarketContractAddress = "0x1fef92c81b4ef16b099330d5cb5981b8bfc69383"; // Fluoridation IQ Market Contract on Base - TODO: Update with actual contract address
export const fluoridationIqConditionalTokensContractAddress = "0xac1365907452b72b4015c7718a165e51439635f6"; // Fluoridation IQ Conditional Tokens Contract on Base - TODO: Update with actual contract address

// Vaccines Autism Market Contracts
export const vaccinesAutismMarketContractAddress = "0x9db8664c16dcffb5b1bb8cde365fd174d46b3c25"; // Vaccines Autism Market Contract on Base
export const vaccinesAutismConditionalTokensContractAddress = "0x49f79f8938bbfc48275903bf0c9deef82efd42a6"; // Vaccines Autism Conditional Tokens Contract on Base

// Trump-Epstein Market Contracts
export const trumpEpsteinMarketContractAddress = "0xbf7b301d6b0542f2b69da5816eda102bbcc2aaf2"; // Trump-Epstein Market Contract on Base
export const trumpEpsteinConditionalTokensContractAddress = "0x3d06ef3054f4b710342568dcfe42ee3876b15236"; // Trump-Epstein Conditional Tokens Contract on Base

// MRNA TurboCancer Market Contracts
export const mrnaTurboCancerMarketContractAddress = "0xdc57601061c30DCdFbE849e2440CC36A929C7205"; // MRNA TurboCancer Market Contract on Base
export const mrnaTurboCancerConditionalTokensContractAddress = "0x5CdFEE6602ABDE289bBDEdBD28BDd7ddC310F416"; // MRNA TurboCancer Conditional Tokens Contract on Base

export const tokenContract = getContract({
    client: client,
    chain: baseSepolia,
    address: tokenContractAddress,
})

export const marketContract = getContract({
    client,
    chain: baseSepolia,
    address: marketContractAddress,
  });

export const conditionalTokensContract = getContract({
    client,
    chain: baseSepolia,
    address: conditionalTokensContractAddress,
  });

// Moon Landing Market Contract Instances
export const moonLandingMarketContract = getContract({
    client,
    chain: baseSepolia,
    address: moonLandingMarketContractAddress,
  });

export const moonLandingConditionalTokensContract = getContract({
    client,
    chain: baseSepolia,
    address: moonLandingConditionalTokensContractAddress,
  });

// Fluoridation IQ Market Contract Instances
export const fluoridationIqMarketContract = getContract({
    client,
    chain: baseSepolia,
    address: fluoridationIqMarketContractAddress,
  });

export const fluoridationIqConditionalTokensContract = getContract({
    client,
    chain: baseSepolia,
    address: fluoridationIqConditionalTokensContractAddress,
  });

// Vaccines Autism Market Contract Instances
export const vaccinesAutismMarketContract = getContract({
    client,
    chain: baseSepolia,
    address: vaccinesAutismMarketContractAddress,
  });

export const vaccinesAutismConditionalTokensContract = getContract({
    client,
    chain: baseSepolia,
    address: vaccinesAutismConditionalTokensContractAddress,
  });

// Trump-Epstein Market Contract Instances
export const trumpEpsteinMarketContract = getContract({
    client,
    chain: baseSepolia,
    address: trumpEpsteinMarketContractAddress,
  });

export const trumpEpsteinConditionalTokensContract = getContract({
    client,
    chain: baseSepolia,
    address: trumpEpsteinConditionalTokensContractAddress,
  });

// MRNA TurboCancer Market Contract Instances
export const mrnaTurboCancerMarketContract = getContract({
    client,
    chain: baseSepolia,
    address: mrnaTurboCancerMarketContractAddress,
  });

export const mrnaTurboCancerConditionalTokensContract = getContract({
    client,
    chain: baseSepolia,
    address: mrnaTurboCancerConditionalTokensContractAddress,
  });

// Helper function to get contracts based on market ID
export function getContractsForMarket(marketId: string) {
  switch (marketId) {
    case 'moon-landing':
      return {
        marketContract: moonLandingMarketContract,
        conditionalTokensContract: moonLandingConditionalTokensContract,
        outcome1PositionId: "97045190584393032725705126979012781984659070008452916210401226821468609683793", // Yes - Base position ID
        outcome2PositionId: "78958204779993795274253300281532453836400562991479897783072243516005340819969", // No - Base position ID
      };
    case 'fluoridation-iq':
      return {
        marketContract: fluoridationIqMarketContract,
        conditionalTokensContract: fluoridationIqConditionalTokensContract,
        outcome1PositionId: "14946061941943856685761247635395957970889875248982696785634054129822017534367", // Yes - Base position ID - TODO: Update with actual position IDs
        outcome2PositionId: "75393856958712793303554406582052086676087333995512007275640246125198049807135", // No - Base position ID - TODO: Update with actual position IDs
      };
    case 'vaccines-autism':
      return {
        marketContract: vaccinesAutismMarketContract,
        conditionalTokensContract: vaccinesAutismConditionalTokensContract,
        outcome1PositionId: "18798560799576673153670704537189888385284889671895194774417086712773358697874", // Yes - Base position ID
        outcome2PositionId: "20961566786533882537095607042902055390201853322066176213662535535024126073990", // No - Base position ID
      };
    case 'trump-epstein':
      return {
        marketContract: trumpEpsteinMarketContract,
        conditionalTokensContract: trumpEpsteinConditionalTokensContract,
        outcome1PositionId: "58569602745504880454893998906792994823592527926438799456077803258100008716603", // Yes - Base position ID
        outcome2PositionId: "100624693178318964440176592559852297470034930992781199766001809650698447186010", // No - Base position ID
      };
    case 'mrna-turbocancer':
      return {
        marketContract: mrnaTurboCancerMarketContract,
        conditionalTokensContract: mrnaTurboCancerConditionalTokensContract,
        outcome1PositionId: "34168952953386005158914283859524538537850500849951758432076805194426472551804", // Yes - Base position ID
        outcome2PositionId: "31399717836710254760347926979497604263634699268784540145161572320974812433148", // No - Base position ID
      };
    case 'jfk':
    default:
      return {
        marketContract: marketContract,
        conditionalTokensContract: conditionalTokensContract,
        outcome1PositionId: "73447690177222413629606936100319296564166817602168097874164059020795331550290", // JFK Yes - Base Sepolia position ID
        outcome2PositionId: "22215270987214765251435732829113647193435911842071361932816156198960676215195", // JFK No - Base Sepolia position ID
      };
  }
}