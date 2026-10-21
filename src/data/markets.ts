export interface Market {
  id: string;
  title: string;
  description: string;
  image: string;
  contractAddress: string;
  outcomes: [string, string]; // [Yes outcome, No outcome]
  rules: string;
  /** When true, hide FPMM buy/sell in the UI and show redeem flow instead (logic remains in codebase). */
  tradingResolved?: boolean;
}

export const markets: Market[] = [
  {
    id: 'jfk',
    title: "CIA Involved in JFK Assassination?",
    description: "Did the CIA aid in the planning or execution of John F. Kennedy's Assassination?",
    image: "/JFKCar.png",
    contractAddress: "0xC8A498Bd0726036F7cdF9bb83f92E9D969970600", // JFK market on Base (verify deployment)
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
    title: "Is the Childhood Vaccine Schedule Linked to Autism?",
    description:
      "Is there clear and convincing evidence linking the CDC-recommended childhood vaccine schedule to a higher likelihood of developing Autism Spectrum Disorder?",
    image: "/RFK.png",
    contractAddress: "0x0000000000000000000000000000000000000000", // Placeholder — replace when deployed
    outcomes: [
      "Yes, the childhood vaccine schedule is linked to autism",
      "No, the childhood vaccine schedule is not linked to autism",
    ],
    rules:
      'This market will resolve to &ldquo;Yes&rdquo; if there is clear and convincing evidence that children following the CDC-recommended childhood vaccine schedule have a higher likelihood of developing Autism Spectrum Disorder over their lifetime compared to unvaccinated children. Otherwise, this market will resolve to &ldquo;No.&rdquo;\n\nPrice oracle. The reference price for this market is the probability estimate for the same &ldquo;Yes&rdquo; outcome described above, as published by superforecasters from the Good Judgment Project for this market. The oracle rule is fixed: it always tracks those superforecasters&rsquo; current published estimate for this question.\n\nContinuous updates. Superforecasters from the Good Judgment Project may revise their estimate for this market at any time, as new evidence or analysis warrants. There is no monthly, quarterly, or other discrete publication schedule that resets the oracle&mdash;when they update their view, the reference price reflects that latest estimate.\n\nTrading vs. oracle. Exchange prices may differ from the oracle at any moment. Between superforecaster updates, participants trade freely and prices are driven by the market mechanism and participant activity; the oracle does not force a price reset on a calendar.\n\nParticipants should treat the oracle as a forward-looking, evidence-weighted probability&mdash;not a final legal or journalistic determination.',
  },
  {
    id: 'glp1-sudden-blindness',
    title: "Is GLP-1 Use Linked to Sudden Onset Blindness?",
    description:
      "Is there clear and convincing evidence that use of GLP-1 receptor agonist medications is linked to sudden onset blindness?",
    image: "/Fluoride.png",
    contractAddress: "0x0000000000000000000000000000000000000000", // Placeholder — replace when deployed
    outcomes: [
      "Yes, GLP-1 use is linked to sudden onset blindness",
      "No, GLP-1 use is not linked to sudden onset blindness",
    ],
    rules:
      'This market will resolve to &ldquo;Yes&rdquo; if there is clear and convincing evidence that use of GLP-1 receptor agonist medications (including, without limitation, drugs such as semaglutide, tirzepatide, liraglutide, and related GLP-1 class therapies) is linked to sudden onset blindness or acute severe vision loss in treated patients, beyond what would be expected from chance, underlying disease, or unrelated causes. Otherwise, this market will resolve to &ldquo;No.&rdquo;\n\nPrice oracle. The reference price for this market is the probability estimate for the same &ldquo;Yes&rdquo; outcome described above, as published by superforecasters from the Good Judgment Project for this market. The oracle rule is fixed: it always tracks those superforecasters&rsquo; current published estimate for this question.\n\nContinuous updates. Superforecasters from the Good Judgment Project may revise their estimate for this market at any time, as new evidence or analysis warrants. There is no monthly, quarterly, or other discrete publication schedule that resets the oracle&mdash;when they update their view, the reference price reflects that latest estimate.\n\nTrading vs. oracle. Exchange prices may differ from the oracle at any moment. Between superforecaster updates, participants trade freely and prices are driven by the market mechanism and participant activity; the oracle does not force a price reset on a calendar.\n\nParticipants should treat the oracle as a forward-looking, evidence-weighted probability&mdash;not a final legal or journalistic determination.',
  },
  {
    id: 'talarico-flu-absence',
    title: "Was Talarico's Campaign Absence Due to the Flu?",
    description:
      "Was James Talarico's roughly two-week absence from the campaign trail caused by influenza (the flu)?",
    image: "/Macron.png",
    contractAddress: "0x0000000000000000000000000000000000000000", // Placeholder — replace when deployed
    outcomes: [
      "Yes, the absence was due to the flu",
      "No, the absence was not due to the flu",
    ],
    rules:
      'This market will resolve to &ldquo;Yes&rdquo; if there is clear and convincing evidence that James Talarico&rsquo;s roughly two-week absence from campaign activities was caused by influenza (the flu), including a medically supported flu diagnosis or equivalent contemporaneous documentation establishing flu as the cause. Otherwise, this market will resolve to &ldquo;No.&rdquo;\n\nPrice oracle. The reference price for this market is the probability estimate for the same &ldquo;Yes&rdquo; outcome described above, as published by superforecasters from the Good Judgment Project for this market. The oracle rule is fixed: it always tracks those superforecasters&rsquo; current published estimate for this question.\n\nContinuous updates. Superforecasters from the Good Judgment Project may revise their estimate for this market at any time, as new evidence or analysis warrants. There is no monthly, quarterly, or other discrete publication schedule that resets the oracle&mdash;when they update their view, the reference price reflects that latest estimate.\n\nTrading vs. oracle. Exchange prices may differ from the oracle at any moment. Between superforecaster updates, participants trade freely and prices are driven by the market mechanism and participant activity; the oracle does not force a price reset on a calendar.\n\nParticipants should treat the oracle as a forward-looking, evidence-weighted probability&mdash;not a final legal or journalistic determination.',
  },
  {
    id: 'epstein-intelligence-agent',
    title: "Was Jeffrey Epstein an Intelligence Agent?",
    description:
      "Is there clear and convincing evidence that Jeffrey Epstein worked as an agent, asset, or operative for an intelligence service?",
    image: "/TrumpEpstein.png",
    contractAddress: "0x0000000000000000000000000000000000000000", // Placeholder — replace when deployed
    outcomes: [
      "Yes, Jeffrey Epstein was an intelligence agent",
      "No, Jeffrey Epstein was not an intelligence agent",
    ],
    rules:
      'This market will resolve to &ldquo;Yes&rdquo; if there is clear and convincing evidence that Jeffrey Epstein worked as an agent, asset, informant, or operative for a national intelligence service (including, without limitation, the CIA, Mossad, MI6, or a comparable foreign or domestic intelligence organization), whether formally employed or operating in a covert or unofficial capacity on behalf of such a service. Otherwise, this market will resolve to &ldquo;No.&rdquo;\n\nPrice oracle. The reference price for this market is the probability estimate for the same &ldquo;Yes&rdquo; outcome described above, as published by superforecasters from the Good Judgment Project for this market. The oracle rule is fixed: it always tracks those superforecasters&rsquo; current published estimate for this question.\n\nContinuous updates. Superforecasters from the Good Judgment Project may revise their estimate for this market at any time, as new evidence or analysis warrants. There is no monthly, quarterly, or other discrete publication schedule that resets the oracle&mdash;when they update their view, the reference price reflects that latest estimate.\n\nTrading vs. oracle. Exchange prices may differ from the oracle at any moment. Between superforecaster updates, participants trade freely and prices are driven by the market mechanism and participant activity; the oracle does not force a price reset on a calendar.\n\nParticipants should treat the oracle as a forward-looking, evidence-weighted probability&mdash;not a final legal or journalistic determination.',
  },
  {
    id: 'covid19',
    title: "Was COVID-19 a Lab Leak?",
    description:
      "Did SARS-CoV-2 (COVID-19) reach humans through a laboratory-associated leak rather than purely through natural zoonotic spillover without such involvement?",
    image: "/CovidVaccine.png",
    contractAddress: "0x0842897551AD876979CcbcEeaDCAfA730DC435A1",
    outcomes: ["Yes, COVID-19 was a lab leak", "No, COVID-19 was not a lab leak"],
    rules:
      'This market will resolve to &ldquo;Yes&rdquo; if there is clear and convincing evidence that SARS-CoV-2 (COVID-19) entered the human population through a laboratory leak from a research or related facility, rather than purely through natural zoonotic spillover without such involvement. Otherwise, this market will resolve to &ldquo;No.&rdquo;\n\nPrice oracle. The reference price for this market is the probability estimate for the same &ldquo;Yes&rdquo; outcome described above, as published by superforecasters from the Good Judgment Project for this market. The oracle rule is fixed: it always tracks those superforecasters&rsquo; current published estimate for this question.\n\nContinuous updates. Superforecasters from the Good Judgment Project may revise their estimate for this market at any time, as new evidence or analysis warrants. There is no monthly, quarterly, or other discrete publication schedule that resets the oracle&mdash;when they update their view, the reference price reflects that latest estimate.\n\nTrading vs. oracle. Exchange prices may differ from the oracle at any moment. Between superforecaster updates, participants trade freely and prices are driven by the market mechanism and participant activity; the oracle does not force a price reset on a calendar.\n\nParticipants should treat the oracle as a forward-looking, evidence-weighted probability&mdash;not a final legal or journalistic determination.',
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
      "No, Bridgitte Macron is a female",
    ],
    rules:
      'This market will resolve to &ldquo;Yes&rdquo; if there is clear and convincing evidence that Brigitte Macron, the First Lady of France, was born a man. Otherwise, this market will resolve to &ldquo;No.&rdquo;\n\nPrice oracle. The reference price for this market is Objection AI&rsquo;s probability estimate for the same &ldquo;Yes&rdquo; outcome described above, as published for this market. See <a href="https://objection.ai/the-process" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Objection AI&rsquo;s process</a>.\n\nPublication schedule. Objection AI will publish the initial price-oracle probability estimate for this case on June 1, 2026. After that, the oracle will publish on a quarterly cadence on the first day of each subsequent quarter: September 1, December 1, March 1, and June 1 each year. Each publication reflects evidence available through that date, including factual developments, court or administrative rulings, and investigative findings.\n\nNo interim rulings or off-cycle oracle. There will be no interim rulings and no interim or off-schedule oracle publications for any market question that follows this quarterly Objection AI schedule. The only official oracle releases are the dates above.\n\nReporting date vs. between updates. On each scheduled reporting date, the reference price for the market is set to match that day&rsquo;s newly published Objection AI estimate (the price update is the oracle value for that release). Between reporting dates, participants may trade freely: prices are driven by the market mechanism and participant activity, not by additional oracle resets, until the next quarterly publication.\n\nParticipants should treat the oracle as a forward-looking, evidence-weighted probability&mdash;not a final legal or journalistic determination&mdash;and should read Objection AI&rsquo;s methodology and disclaimers alongside this market (<a href="https://objection.ai/the-process" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">objection.ai/the-process</a>).',
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

const EXPOSED_MARKET_IDS = new Set<string>([
  "covid19",
  "glp1-sudden-blindness",
  "talarico-flu-absence",
  "autism",
  "epstein-intelligence-agent",
]);

export function getMarketById(id: string): Market | undefined {
  // MVP: only expose a small set of markets for now.
  if (!EXPOSED_MARKET_IDS.has(id)) return undefined;
  return markets.find((market) => market.id === id);
}

export function getAllMarkets(): Market[] {
  // MVP: only expose a small set of markets for now.
  // Order controls homepage: [featured, ...secondary]
  const orderedIds: string[] = [
    "covid19",
    "glp1-sudden-blindness",
    "talarico-flu-absence",
    "autism",
    "epstein-intelligence-agent",
  ];
  return orderedIds
    .map((id) => markets.find((m) => m.id === id))
    .filter((m): m is Market => Boolean(m));
} 