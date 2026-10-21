/** Same 2^64 fixed-point scale as real `odds-history` rows / markets UI. */
const ODDS_HISTORY_FIXED_POINT = Number("18446744073709551616");

/**
 * Temporary display odds for markets without a live FPMM yet.
 * Probabilities are approximate placeholders for UI preview only.
 */
export const MOCK_YES_PROBABILITY: Record<string, number> = {
  // Semaglutide/NAION association is contested; markets often price a real-but-uncertain link.
  "glp1-sudden-blindness": 0.29,
  // Campaign illness claims are hard to verify; near coin-flip until better evidence.
  "talarico-flu-absence": 0.46,
  // Strong scientific consensus against a schedule→autism link; low Yes.
  autism: 0.12,
  // Long-running speculation; material but far from settled.
  "epstein-intelligence-agent": 0.37,
};

export type MockOddsProbs = { yes: number; no: number };

export function getMockProbs(marketId: string): MockOddsProbs | null {
  const yes = MOCK_YES_PROBABILITY[marketId];
  if (typeof yes !== "number" || !Number.isFinite(yes)) return null;
  const clamped = Math.min(0.95, Math.max(0.05, yes));
  return { yes: clamped, no: 1 - clamped };
}

export function hasMockOdds(marketId: string): boolean {
  return marketId in MOCK_YES_PROBABILITY;
}

export type MockOddsHistoryEntry = {
  id: number;
  marketId: string;
  yesProbability: number;
  noProbability: number;
  timestamp: string;
};

/**
 * Deterministic synthetic history ending at the mock current Yes probability.
 * Values are stored in the same 2^64 fixed-point scale as real `odds-history` rows.
 */
export function buildMockOddsHistory(marketId: string, points = 40): MockOddsHistoryEntry[] {
  const current = getMockProbs(marketId);
  if (!current) return [];

  // Simple seeded PRNG so SSR/client charts match.
  let seed = 0;
  for (let i = 0; i < marketId.length; i++) seed = (seed * 31 + marketId.charCodeAt(i)) >>> 0;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  // Walk backward from current yes with small day-to-day moves, then reverse.
  const yesSeries: number[] = [];
  let y = current.yes;
  for (let i = 0; i < points; i++) {
    yesSeries.push(y);
    const shock = (next() - 0.5) * 0.035;
    y = Math.min(0.92, Math.max(0.06, y - shock));
  }
  yesSeries.reverse();
  // Pin the last point exactly to current.
  yesSeries[yesSeries.length - 1] = current.yes;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return yesSeries.map((yes, i) => {
    const no = 1 - yes;
    return {
      id: i + 1,
      marketId,
      yesProbability: yes * ODDS_HISTORY_FIXED_POINT,
      noProbability: no * ODDS_HISTORY_FIXED_POINT,
      timestamp: new Date(now - (points - 1 - i) * dayMs).toISOString(),
    };
  });
}
