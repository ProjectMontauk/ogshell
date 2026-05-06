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
    title: "How Long Do mRNA Spike Proteins Persist?",
    description: "Do vaccine-derived mRNA spike proteins remain in the body for longer than one year after vaccination?",
    image: "/Moon.png",
    contractAddress: "0x5Af20651c5a8fAd0d1E38122183fEB8bC0838716",
    outcomes: [
      "Yes, spike proteins persist longer than one year",
      "No, spike proteins do not persist longer than one year"
    ],
    rules: "The market \"How Long Do mRNA Spike Proteins Persist?\" will resolve \"Yes\" if the WSJ scientific review board finds clear and convincing evidence that vaccine-derived mRNA spike proteins (or their translated spike protein products) remain detectably present in human tissues, blood, or other relevant biological compartments for longer than one year after vaccination, under typical dosing and exposure conditions.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find clear and convincing evidence that vaccine-derived mRNA spike proteins persist in the body for longer than one year after vaccination under typical conditions.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'fluoride',
    title: "Does Water Fluoridation Decrease IQ?",
    description: "The Citizen market.",
    image: "/Fluoride.png",
    contractAddress: "0xC845FAdec3f3A1B6c513d0D9928faEa02eBeFcdb",
    outcomes: ["Yes, fluoridation decreases IQ:", "No, fluoridation does not decrease IQ"],
    rules: "The market \"Does Water Fluoridation Decrease IQ?\" will resolve \"Yes\" if the WSJ scientific review board finds clear and convincing evidence that community water fluoridation, at typical concentrations used in municipal water systems, causes a meaningful decrease in average IQ or cognitive function in exposed human populations relative to comparable non-fluoridated populations, after accounting for reasonable confounders.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find clear and convincing evidence that water fluoridation decreases IQ under typical exposure conditions.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'autism',
    title: "Childhood Vaccines Linked to Autism?",
    description: "Is there clear and convincing evidence linking the CDC-recommended childhood vaccine schedule to a higher likelihood of developing Autism Spectrum Disorder?",
    image: "/RFK.png",
    contractAddress: "0x80863c2f689b293049564a68e781fd4d4ae01858",
    outcomes: ["Yes, childhood vaccines linked to autism:", "No, childhood vaccines not linked to autism:"],
    rules: "The market will resolve \"Yes\" if the WSJ scientific review board finds that there is a clear and convincing evidence establishing the link between children following the CDC-recommended childhood vaccine schedule and a higher likelihood of developing Autism Spectrum Disorder over their lifetime compared to unvaccinated children.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find a clear and convincing evidence supporting the link between childhood vaccines and a higher likelihood of developing Autism Spectrum Disorder.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: 'covid19',
    title: "Was COVID-19 Genetically Engineered?",
    description: "Was SARS-CoV-2 (COVID-19) genetically engineered in a lab rather than arising purely from natural zoonotic spillover?",
    image: "/CovidVaccine.png",
    contractAddress: "0x157a7bc878c625b9f85136BC75Bdb7503a0C5171",
    outcomes: [
      "Yes, COVID-19 was genetically engineered",
      "No, COVID-19 was not genetically engineered"
    ],
    rules: "The market will resolve \"Yes\" if the WSJ scientific review board finds clear and convincing evidence that SARS-CoV-2 (COVID-19) was genetically engineered in a laboratory, including but not limited to intentional modification of viral genetic material that materially departs from known natural evolution.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ scientific review board did not find clear and convincing evidence that COVID-19 was genetically engineered, and natural or non-engineered origins remain more consistent with the available evidence.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ scientific review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  },
  {
    id: "brigitte-macron-born-man",
    title: "Was Brigitte Macron Born a Man?",
    description:
      "Is there clear and convincing evidence that Brigitte Macron was assigned male at birth or lived as male prior to her public identity as Brigitte Macron?",
    image: "/MRNATurboCancer.png",
    contractAddress: "0x2E26448da0740F3877cf9dDE6c179E396076B552",
    outcomes: [
      "Yes, Brigitte Macron was born male",
      "No, Brigitte Macron was not born male",
    ],
    rules:
      'This market concerns whether Brigitte Macron was assigned male at birth or lived under a male identity in a way that substantiates an affirmative answer to the question in the title.\n\n<strong>Price oracle.</strong> The reference price for this market is <strong>Objection AI&rsquo;s probability estimate</strong> for an affirmative answer to that case (the estimated likelihood that the claim is true), as published or otherwise made available by Objection AI for this market. See <a href="https://objection.ai/the-process" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Objection AI&rsquo;s process</a>.\n\n<strong>Publication schedule.</strong> Objection AI will publish the <strong>initial</strong> price-oracle probability estimate for this case on <strong>June 1, 2026</strong>. After that, the oracle will publish on a <strong>quarterly</strong> cadence on the first day of each subsequent quarter: <strong>September 1</strong>, <strong>December 1</strong>, <strong>March 1</strong>, and <strong>June 1</strong> each year (e.g., September 1, 2026; December 1, 2026; March 1, 2027; June 1, 2027; and so on). Each publication reflects evidence available through that date, including factual developments, court or administrative rulings, and investigative findings.\n\n<strong>No interim rulings or off-cycle oracle.</strong> There will be <strong>no interim rulings</strong> and <strong>no interim or off-schedule oracle publications</strong> for any market question that follows this quarterly Objection AI schedule. The only official oracle releases are the dates above.\n\n<strong>Reporting date vs. between updates.</strong> On each scheduled reporting date, the <strong>reference price</strong> for the market is set to match that day&rsquo;s newly published Objection AI estimate (the price update is the oracle value for that release). <strong>Between</strong> reporting dates, participants may <strong>trade freely</strong>: prices are driven by the market mechanism and participant activity, not by additional oracle resets, until the next quarterly publication.\n\nParticipants should treat the oracle as a forward-looking, evidence-weighted probability&mdash;not a final legal or journalistic determination&mdash;and should read Objection AI&rsquo;s methodology and disclaimers alongside this market (<a href="https://objection.ai/the-process" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">objection.ai/the-process</a>).',
  },
  {
    id: '2020',
    title: "Was There Widespread Fraud in the 2020 Election?",
    description: "Did widespread, outcome-changing fraud occur in the 2020 U.S. presidential election?",
    image: "/TrumpEpstein.png",
    contractAddress: "0xbD486697125C4a2Be7B3BDb1A4428167C575dd7d",
    outcomes: [
      "Yes, there was widespread fraud in 2020",
      "No, there was not widespread fraud in 2020"
    ],
    rules: "The market will resolve \"Yes\" if the WSJ history review board finds clear and convincing evidence that widespread, outcome-changing fraud occurred in the 2020 U.S. presidential election—meaning fraudulent or invalid votes, or unlawful interference, were sufficient in scope to plausibly change the Electoral College outcome.\n\nOtherwise, the market will resolve \"No.\" This means the WSJ history review board did not find clear and convincing evidence of such widespread, outcome-changing fraud; isolated irregularities, local misconduct, or unproven allegations are not sufficient for a \"Yes\" resolution.\n\nThis market will close February 20th, 2026 at 11:59 AM EDT and within three days of market close, the review board will resolve the market and author the case summary.\n\nFind out more about the WSJ history review board <a href=\"/docs?tab=review-boards\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #2563eb; text-decoration: underline;\">here</a>."
  }
];

const EXPOSED_MARKET_IDS = new Set<string>(["covid19", "brigitte-macron-born-man"]);

export function getMarketById(id: string): Market | undefined {
  // MVP: only expose a small set of markets for now.
  if (!EXPOSED_MARKET_IDS.has(id)) return undefined;
  return markets.find((market) => market.id === id);
}

export function getAllMarkets(): Market[] {
  // MVP: only expose a small set of markets for now.
  // Order controls homepage: [featured, ...secondary]
  const orderedIds: string[] = ["covid19", "brigitte-macron-born-man"];
  return orderedIds
    .map((id) => markets.find((m) => m.id === id))
    .filter((m): m is Market => Boolean(m));
} 