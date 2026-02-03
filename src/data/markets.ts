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
    contractAddress: "0xa015eBbaB5c6db0748a504ea71589BE21B2Cbe22", // JFK Market Contract on Base
    outcomes: ["Yes, CIA involved in JFK's death", "No, CIA innocent in JFK's death"],
    rules: "The market will resolve \"Yes\" if the WSJ history review board finds that there is a clear and convincing evidence establishing that current or former CIA personnel aided in the planning or execution of President John F. Kennedy's Assassination.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ history review board did not find a clear and convincing evidence supporting that current or former CIA personnel aided in the planning or execution of President John F. Kennedy's Assassination.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ history review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."

  },
  {
    id: 'moon-landing',
    title: "Is the Apollo 11 Moon Landing Fake?",
    description: "Did humans actually land on the moon?",
    image: "/Moon.png",
    contractAddress: "0xeeaca4019f25e573c33a0de266ba0d1020932cc9", // Moon Landing Market Contract on Base
    outcomes: ["Yes, Moon Landing was Fake", "No, Moon Landing was real"],
    rules: "The market will resolve \"Yes\" if the WSJ history review board finds that there is a clear and convincing evidence establishing that Neil Armstrong and Buzz Aldrin did not physically walk on the moon during the Apollo 11 mission in 1969.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ history review board did not find a clear and convincing evidence supporting that the Apollo 11 moon landing was fake, staged, or exaggerated to an extent where the Apollo 11 Crew never walked on the moon.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ history review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'fluoridation-iq',
    title: "Does Water Fluoridation Decrease IQ?",
    description: "Does water fluoridation decrease IQ?",
    image: "/Fluoride.png",
    contractAddress: "0x1fef92c81b4ef16b099330d5cb5981b8bfc69383", // Fluoridation IQ Market Contract on Base - TODO: Update with actual contract address
    outcomes: ["Yes, fluoridation decreases IQ", "No, fluoridation does not decrease IQ"],
    rules: "The market will resolve \"Yes\" if the WSJ scientific review board finds that there is a clear and convincing evidence establishing the link between community water fluoridation and a measurable decline in population-level IQ.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find a clear and convincing evidence supporting the link between community water fluoridation and a measurable decline in population-level IQ.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'vaccines-autism',
    title: "Childhood Vaccines Linked to Autism?",
    description: "Are childhood vaccines linked to higher rates of autism?",
    image: "/RFK.png", // Placeholder image until we add the actual photo
    contractAddress: "0x9db8664c16dcffb5b1bb8cde365fd174d46b3c25", // Vaccines Autism Market Contract on Base
    outcomes: ["Yes, childhood vaccines linked to autism", "No, childhood vaccines not linked to autism"],
    rules: "The market will resolve \"Yes\" if the WSJ scientific review board finds that there is a clear and convincing evidence establishing the link between children following the CDC-recommended childhood vaccine schedule and a higher likelihood of developing Autism Spectrum Disorder over their lifetime compared to unvaccinated children.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find a clear and convincing evidence supporting the link between childhood vaccines and a higher likelihood of developing Autism Spectrum Disorder.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'trump-epstein',
    title: "Is Trump an Epstein-Pedophile?",
    description: "Did Trump engage in inappropriate sexual relations with a minor, likely in association with Jeffrey Epstein?",
    image: "/TrumpEpstein.png", // Placeholder image - you'll need to add this image
    contractAddress: "0xbf7b301d6b0542f2b69da5816eda102bbcc2aaf2", // Trump Epstein Market Contract on Base
    outcomes: ["Yes, Trump a pedophile", "No, Trump not a pedophile"],
    rules: "The market will resolve \"Yes\" if the WSJ history review board finds that there is a clear and convincing evidence establishing that Donald Trump engaged in inappropriate sexual relations with a minor, likely in association with Jeffrey Epstein.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ history review board did not find a clear and convincing evidence supporting that Donald Trump engaged in inappropriate sexual relations with a minor, likely in association with Jeffrey Epstein.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ history review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'mrna-turbocancer',
    title: "MRNA Vax Linked to Cancer?",
    description: "Do COVID-19 MRNA vaccinations cause turbo cancers?",
    image: "/MRNATurboCancer.png", // Placeholder image - you'll need to add this image
    contractAddress: "0xdc57601061c30DCdFbE849e2440CC36A929C7205", // MRNA TurboCancer Market Contract on Base
    outcomes: ["Yes, MRNA vax linked to cancer", "No, MRNA vax not linked to cancer"],
    rules: "The market will resolve \"Yes\" if the WSJ scientific review board finds that there is a clear and convincing evidence establishing the link between COVID-19 mRNA vaccinations and an increase in cancer rates compared to unvaccinated individuals.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find a clear and convincing evidence supporting the link between COVID-19 mRNA vaccinations and an increase in cancer rates.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  }
];

export function getMarketById(id: string): Market | undefined {
  return markets.find(market => market.id === id);
}

export function getAllMarkets(): Market[] {
  return markets;
} 