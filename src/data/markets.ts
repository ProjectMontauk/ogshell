export interface Market {
  id: string;
  title: string;
  description: string;
  image: string;
  contractAddress: string;
  outcomes: [string, string]; // [Yes outcome, No outcome]
  rules: string;
}

export const markets: Market[] = [
  {
    id: 'jfk',
    title: "CIA Involved in JFK Assassination?",
    description: "Did the CIA aid in the planning or execution of John F. Kennedy's Assassination?",
    image: "/JFKCar.png",
    contractAddress: "0x3010D5d9C567763Fa90399BE5C82fA02a5a9295F", // CIA / JFK Market on Base Sepolia
    outcomes: ["Yes, CIA involved in JFK's death", "No, CIA innocent in JFK's death"],
    rules: "The market will resolve \"Yes\" if the WSJ history review board finds that there is a clear and convincing evidence establishing that current or former CIA personnel aided in the planning or execution of President John F. Kennedy's Assassination.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ history review board did not find a clear and convincing evidence supporting that current or former CIA personnel aided in the planning or execution of President John F. Kennedy's Assassination.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ history review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'apollo-11-moon-landing-fake',
    title: "Apollo 11 Moon Landing Fake",
    description: "Was the Apollo 11 moon landing faked or staged?",
    image: "/Moon.png",
    contractAddress: "0xC27Ff60bC9521c9E883932734f90858b1315FdC3",
    outcomes: ["Yes, Apollo 11 moon landing was faked", "No, Apollo 11 moon landing was real"],
    rules: "The market resolves \"Yes\" if it is determined that the Apollo 11 moon landing was faked or staged. Otherwise the market resolves \"No.\""
  }
];

export function getMarketById(id: string): Market | undefined {
  return markets.find(market => market.id === id);
}

export function getAllMarkets(): Market[] {
  return markets;
} 