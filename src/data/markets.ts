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
    contractAddress: "0xC8A498Bd0726036F7cdF9bb83f92E9D969970600", // CIA / JFK Market on Base Sepolia
    outcomes: ["Yes, CIA involved in JFK's death", "No, CIA innocent in JFK's death"],
    rules: "The market will resolve \"Yes\" if the WSJ history review board finds that there is a clear and convincing evidence establishing that current or former CIA personnel aided in the planning or execution of President John F. Kennedy's Assassination.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ history review board did not find a clear and convincing evidence supporting that current or former CIA personnel aided in the planning or execution of President John F. Kennedy's Assassination.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ history review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'apollo-11-moon-landing-fake',
    title: "Apollo 11 Moon Landing Fake",
    description: "Was the Apollo 11 moon landing faked or staged?",
    image: "/Moon.png",
    contractAddress: "0x5Af20651c5a8fAd0d1E38122183fEB8bC0838716",
    outcomes: ["Yes, Apollo 11 moon landing was faked", "No, Apollo 11 moon landing was real"],
    rules: "The market resolves \"Yes\" if it is determined that the Apollo 11 moon landing was faked or staged. Otherwise the market resolves \"No.\""
  },
  {
    id: 'fluoride',
    title: "Does Water Fluoridation Decrease IQ?",
    description: "The Citizen market.",
    image: "/Fluoride.png",
    contractAddress: "0xC845FAdec3f3A1B6c513d0D9928faEa02eBeFcdb",
    outcomes: ["Yes, fluoridation decreases IQ:", "No, fluoridation does not decrease IQ"],
    rules: "Update with market resolution rules."
  },
  {
    id: 'autism',
    title: "Childhood Vaccines Linked to Autism?",
    description: "Is there clear and convincing evidence linking the CDC-recommended childhood vaccine schedule to a higher likelihood of developing Autism Spectrum Disorder?",
    image: "/RFK.png",
    contractAddress: "0x80863c2f689b293049564a68e781fd4d4ae01858",
    outcomes: ["Yes, childhood vaccines linked to autism:", "No, childhood vaccines not linked to autism:"],
    rules: "The market will resolve \"Yes\" if the WSJ scientific review board finds that there is a clear and convincing evidence establishing the link between children following the CDC-recommended childhood vaccine schedule and a higher likelihood of developing Autism Spectrum Disorder over their lifetime compared to unvaccinated children.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find a clear and convincing evidence supporting the link between childhood vaccines and a higher likelihood of developing Autism Spectrum Disorder.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  }
];

export function getMarketById(id: string): Market | undefined {
  return markets.find(market => market.id === id);
}

export function getAllMarkets(): Market[] {
  return markets;
} 