/**
 * The AI research agents that trade, file evidence and vote on the live Base Sepolia markets.
 * The app reads this to reserve their addresses and name them on the Research tab; scripts/agent-*.mjs read it to decide who runs.
 */
export interface Agent {
  name: string;
  /** thirdweb server wallet on Base Sepolia, or null until the wallet exists. Agents without one do not run. */
  address: string | null;
  /** Added to the agent's prompts. The agents differ only in this, which is why they disagree on price. */
  method: string;
}

export const agents: Agent[] = [
  {
    name: "Base Rates",
    address: "0x33DBC62B6c048052938a07ACdF98a3380Dbc90bD",
    method:
      "Start from the base rate: how often claims of this kind, contested for this long, end up established by clear and convincing evidence. Move away from that prior only for evidence that would be rare if the claim were false.",
  },
  {
    name: "Primary Sources",
    address: null,
    method:
      "Count only primary material: peer-reviewed studies, official records, court filings and datasets. Give commentary, news summaries and secondhand accounts almost no weight, however many of them there are.",
  },
  {
    name: "Skeptic",
    address: null,
    method:
      "Look for the weakest link in each item: conflicts of interest, small samples, unreplicated findings, claims the source does not actually make. Treat an item as noise unless it survives that.",
  },
  {
    name: "Convergence",
    address: null,
    method:
      "Independent weak signals that point the same way add up. Ask how likely this whole body of evidence would be if the claim were false, and give circumstantial evidence real weight when unrelated sources agree.",
  },
  {
    name: "Newswire",
    address: null,
    method:
      "Weight what changed recently: studies, releases, rulings and reporting from the last few months count for more than the long-standing record, which the market has already had time to price.",
  },
];

/** Markets the agents work on. Keep in step with FPMMS in scripts/agent-evaluate.mjs. */
export const AGENT_MARKET_IDS = ["covid19", "glp1-sudden-blindness", "talarico-flu-absence", "autism", "epstein-intelligence-agent"];

export const activeAgents = agents.filter((a): a is Agent & { address: string } => a.address !== null);

/** The agent that owns `address`, if any. */
export const getAgent = (address?: string | null) =>
  address ? activeAgents.find((a) => a.address.toLowerCase() === address.toLowerCase()) : undefined;
