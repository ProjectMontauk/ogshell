import { client } from "../src/client";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

// CIA / JFK Market on Base Sepolia
export const marketContractAddress = "0xC8A498Bd0726036F7cdF9bb83f92E9D969970600";
export const tokenContractAddress = "0x7874Fea8563cdA853a0DaBF54B7e8E770F726dDb"; // Cash token on Base Sepolia
export const conditionalTokensContractAddress = "0x89A801b50B5E9A0340C1DF407Ae5D20B015Ca6a9"; // Conditional Tokens Contract on Base Sepolia
export const jfkConditionalTokensContractAddress = "0x38418d6F5DC98280506E0EFd609754EcA5c6BFd3"; // JFK market Conditional Tokens (balanceOf for purchased shares)

// Fluoridation IQ Market Contracts
export const fluoridationIqMarketContractAddress = "0x1fef92c81b4ef16b099330d5cb5981b8bfc69383"; // Fluoridation IQ Market Contract on Base - TODO: Update with actual contract address
export const fluoridationIqConditionalTokensContractAddress = "0xac1365907452b72b4015c7718a165e51439635f6"; // Fluoridation IQ Conditional Tokens Contract on Base - TODO: Update with actual contract address

// Vaccines Autism / Childhood Vaccines Market Contracts
export const vaccinesAutismMarketContractAddress = "0x80863c2f689b293049564a68e781fd4d4ae01858"; // Childhood Vaccines Linked to Autism Market Contract on Base
export const vaccinesAutismConditionalTokensContractAddress = "0x8Bb4f3bc065332c284dB19D0013e44b0732b544c"; // Childhood Vaccines Linked to Autism Conditional Tokens Contract on Base

// Childhood Vaccination Schedule Market Contracts
export const childhoodScheduleMarketContractAddress = "0x157a7bc878c625b9f85136BC75Bdb7503a0C5171";
export const childhoodScheduleConditionalTokensContractAddress = "0x73364a5bA65CB66dfc1054c6A3f51b10e450515D";

// Trump-Epstein Market Contracts
export const trumpEpsteinMarketContractAddress = "0xbf7b301d6b0542f2b69da5816eda102bbcc2aaf2"; // Trump-Epstein Market Contract on Base
export const trumpEpsteinConditionalTokensContractAddress = "0x3d06ef3054f4b710342568dcfe42ee3876b15236"; // Trump-Epstein Conditional Tokens Contract on Base

// 2020 Election Fraud Market Contracts
export const election2020MarketContractAddress = "0xbD486697125C4a2Be7B3BDb1A4428167C575dd7d";
export const election2020ConditionalTokensContractAddress = "0x956af93ef79a5d458f0dBEf1c7B03d9Cd2134606";

// MRNA TurboCancer Market Contracts (legacy)
export const mrnaTurboCancerMarketContractAddress = "0xdc57601061c30DCdFbE849e2440CC36A929C7205"; // Legacy TurboCancer Market
export const mrnaTurboCancerConditionalTokensContractAddress = "0x5CdFEE6602ABDE289bBDEdBD28BDd7ddC310F416"; // Legacy TurboCancer CT

// MRNA Market Contracts (new)
export const mrnaMarketContractAddress = "0x2E26448da0740F3877cf9dDE6c179E396076B552";
export const mrnaConditionalTokensContractAddress = "0xe918709C225E4a2BDB8231B8a316025B415E1fAE";

// Apollo 11 Moon Landing Fake Market Contracts
export const apollo11MoonLandingFakeMarketContractAddress = "0x5Af20651c5a8fAd0d1E38122183fEB8bC0838716";
export const apollo11MoonLandingFakeConditionalTokensContractAddress = "0x097c4e0Bf45223Ef238B5B8eD26970Ce6c0281f3";

// The Citizen / Water Fluoridation Market Contracts
export const citizenMarketContractAddress = "0xC845FAdec3f3A1B6c513d0D9928faEa02eBeFcdb";
export const citizenConditionalTokensContractAddress = "0x530663011BaC49d889175c5397Ad593f1AD1b2Ad";

// Placeholder Market Contracts
export const placeholderMarketContractAddress = "0x4b468b0d30d0ff3fcf70d87ef55efc9568dbecc0";
export const placeholderConditionalTokensContractAddress = "0x89A801b50B5E9A0340C1DF407Ae5D20B015Ca6a9";

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

export const jfkConditionalTokensContract = getContract({
  client,
  chain: baseSepolia,
  address: jfkConditionalTokensContractAddress,
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

// Vaccines Autism / Childhood Vaccines Market Contract Instances
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

// Childhood Vaccination Schedule Market Contract Instances
export const childhoodScheduleMarketContract = getContract({
  client,
  chain: baseSepolia,
  address: childhoodScheduleMarketContractAddress,
});

export const childhoodScheduleConditionalTokensContract = getContract({
  client,
  chain: baseSepolia,
  address: childhoodScheduleConditionalTokensContractAddress,
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

// 2020 Election Fraud Market Contract Instances
export const election2020MarketContract = getContract({
  client,
  chain: baseSepolia,
  address: election2020MarketContractAddress,
});

export const election2020ConditionalTokensContract = getContract({
  client,
  chain: baseSepolia,
  address: election2020ConditionalTokensContractAddress,
});

// MRNA TurboCancer Market Contract Instances (legacy)
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

// MRNA Market Contract Instances (new)
export const mrnaMarketContract = getContract({
  client,
  chain: baseSepolia,
  address: mrnaMarketContractAddress,
});

export const mrnaConditionalTokensContract = getContract({
  client,
  chain: baseSepolia,
  address: mrnaConditionalTokensContractAddress,
});

// Apollo 11 Moon Landing Fake Market Contract Instances
export const apollo11MoonLandingFakeMarketContract = getContract({
  client,
  chain: baseSepolia,
  address: apollo11MoonLandingFakeMarketContractAddress,
});

export const apollo11MoonLandingFakeConditionalTokensContract = getContract({
  client,
  chain: baseSepolia,
  address: apollo11MoonLandingFakeConditionalTokensContractAddress,
});

// The Citizen Market Contract Instances
export const citizenMarketContract = getContract({
  client,
  chain: baseSepolia,
  address: citizenMarketContractAddress,
});

export const citizenConditionalTokensContract = getContract({
  client,
  chain: baseSepolia,
  address: citizenConditionalTokensContractAddress,
});

// Placeholder Market Contract Instances
export const placeholderMarketContract = getContract({
  client,
  chain: baseSepolia,
  address: placeholderMarketContractAddress,
});

export const placeholderConditionalTokensContract = getContract({
  client,
  chain: baseSepolia,
  address: placeholderConditionalTokensContractAddress,
});

// Helper function to get contracts based on market ID
export function getContractsForMarket(marketId: string) {
  switch (marketId) {
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
    case '2020':
      return {
        marketContract: election2020MarketContract,
        conditionalTokensContract: election2020ConditionalTokensContract,
        outcome1PositionId: "40614193518360913970226124677749381632350308571005093118475957000568774242971", // Yes
        outcome2PositionId: "58116257483970964096657388215232762342206318474717149180572590797145458535293", // No
      };
    case 'mrna-turbocancer':
      return {
        marketContract: mrnaTurboCancerMarketContract,
        conditionalTokensContract: mrnaTurboCancerConditionalTokensContract,
        outcome1PositionId: "34168952953386005158914283859524538537850500849951758432076805194426472551804", // Yes - Base position ID
        outcome2PositionId: "31399717836710254760347926979497604263634699268784540145161572320974812433148", // No - Base position ID
      };
    case 'mrna':
      return {
        marketContract: mrnaMarketContract,
        conditionalTokensContract: mrnaConditionalTokensContract,
        outcome1PositionId: "80733807866494044064989264593748570883346602976352867452962636788272969620484", // Yes
        outcome2PositionId: "82014206595205999966836145615591894490967798855888777269788802495716431801547", // No
      };
    case 'apollo-11-moon-landing-fake':
      return {
        marketContract: apollo11MoonLandingFakeMarketContract,
        conditionalTokensContract: apollo11MoonLandingFakeConditionalTokensContract,
        outcome1PositionId: "19240072908051422858567531872907377759204560755767841038267344394720196826061", // Yes
        outcome2PositionId: "94149467698680814353316726576100038444402729322933448584166012738934466766066", // No
      };
    case 'fluoride':
      return {
        marketContract: citizenMarketContract,
        conditionalTokensContract: citizenConditionalTokensContract,
        outcome1PositionId: "113455186744106652314554907177811965385161301057040133519238858076072918462511", // Yes
        outcome2PositionId: "55969771879171203019419383788318237610651838481807480369492917672885836669646", // No
      };
    case 'autism':
      return {
        marketContract: vaccinesAutismMarketContract,
        conditionalTokensContract: vaccinesAutismConditionalTokensContract,
        outcome1PositionId: "71226290096252067581285629648336995324141243340652304533540652151956232685208", // Yes
        outcome2PositionId: "113421302367171696969861912860096314580872080487022862883618672561264857104737", // No
      };
    case 'covid19':
      return {
        marketContract: childhoodScheduleMarketContract,
        conditionalTokensContract: childhoodScheduleConditionalTokensContract,
        outcome1PositionId: "108684136335277130135265777398052987432837857262679254848226846622093149525918", // Yes
        outcome2PositionId: "15153390020795065622106410905394424546223685555437079064422596802362857499212", // No
      };
    case 'jfk':
      return {
        marketContract: marketContract,
        conditionalTokensContract: jfkConditionalTokensContract,
        outcome1PositionId: "106261875985794048016015173960046707849790672402976848528328852263946132372637", // JFK Yes
        outcome2PositionId: "32733382695058793248258855857256065534850992451102373040084989402733589471956", // JFK No
      };
    default:
      return {
        marketContract: marketContract,
        conditionalTokensContract: conditionalTokensContract,
        outcome1PositionId: "106261875985794048016015173960046707849790672402976848528328852263946132372637", // JFK Yes - Base Sepolia position ID
        outcome2PositionId: "32733382695058793248258855857256065534850992451102373040084989402733589471956", // JFK No - Base Sepolia position ID
      };
  }
}