"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getContract, readContract } from "thirdweb";
import { client } from "../src/client";
import { baseSepolia } from "thirdweb/chains";
import { getAllMarkets, Market } from "../src/data/markets";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// Backend API base URL - same-origin Next.js API routes
const API_BASE_URL = "";

const INVESTMENT_AMOUNT = BigInt("1000000000000000000"); // 1e18 for FPMM calcBuyAmount

// Small hook to fetch FPMM yes/no probabilities for a single market
const useFpmmProbabilities = (market: Market) => {
  const [probs, setProbs] = useState<{ yes: number; no: number } | null>(null);

  const marketContractInstance = getContract({
    client,
    chain: baseSepolia,
    address: market.contractAddress,
  });

  const fetchFpmmOdds = useCallback(async () => {
    try {
      const [sharesYes, sharesNo] = await Promise.all([
        readContract({
          contract: marketContractInstance,
          method:
            "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 0n],
        }),
        readContract({
          contract: marketContractInstance,
          method:
            "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
          params: [INVESTMENT_AMOUNT, 1n],
        }),
      ]);
      const inv = Number(INVESTMENT_AMOUNT);
      const sY = Number(sharesYes);
      const sN = Number(sharesNo);
      if (sY <= 0 || sN <= 0) return;
      const oddsYesRaw = inv / sY;
      const oddsNoRaw = inv / sN;
      const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
      const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
      setProbs({ yes: probYes, no: probNo });
    } catch (e) {
      console.error("Homepage FPMM odds error:", e);
      setProbs(null);
    }
  }, [marketContractInstance]);

  useEffect(() => {
    fetchFpmmOdds();
  }, [fetchFpmmOdds, market.id]);

  return probs;
};

// Large featured banner market at top of homepage
const FeaturedMarket = ({ market }: { market: Market }) => {
  const router = useRouter();
  const probs = useFpmmProbabilities(market);
  const yes = probs?.yes ?? 0;
  const no = probs?.no ?? 0;

  // Mini odds history chart data for featured market
  const [featuredHistory, setFeaturedHistory] = useState<
    { timestamp: string; Yes: number; No: number }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/odds-history?marketId=${market.id}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const ODDS_DIVISOR = Number("18446744073709551616");
        const sliced = data.slice(-40);
        const chart = sliced.map(
          (
            entry: {
              timestamp: string | number | Date;
              yesProbability?: number;
              noProbability?: number;
            }
          ) => ({
          timestamp: new Date(entry.timestamp).toISOString().slice(5, 10), // MM-DD
          Yes:
            typeof entry.yesProbability === "number"
              ? entry.yesProbability / ODDS_DIVISOR
              : 0,
          No:
            typeof entry.noProbability === "number"
              ? entry.noProbability / ODDS_DIVISOR
              : 0,
          })
        );
        if (!cancelled) setFeaturedHistory(chart);
      } catch (e) {
        console.error("Featured odds history error:", e);
      }
    };
    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [market.id]);
  const yesPct = yes > 0 ? Math.round(yes * 100) : null;
  const noPct = no > 0 ? Math.round(no * 100) : null;
  const yesOdds = yes > 0 ? (1 / yes).toFixed(2) : null;
  const noOdds = no > 0 ? (1 / no).toFixed(2) : null;

  return (
    <div
      className="bg-white rounded-2xl shadow border border-gray-200 p-5 md:p-6 lg:p-7 cursor-pointer hover:shadow-xl transition"
      onClick={() => router.push(`/markets/${market.id}`)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter") router.push(`/markets/${market.id}`);
      }}
    >
      <div className="flex flex-col lg:flex-row gap-5">
        {market.id !== "jfk" && (
          <div className="lg:w-2/5">
            <Image
              src={market.image}
              alt={market.title}
              width={640}
              height={360}
              className="w-full h-52 md:h-64 lg:h-60 rounded-xl object-cover object-top"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
              {market.title}
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4 line-clamp-3">
              {market.description}
            </p>
            {/* Yes / No rows: fixed gap from bars to odds (match market card spacing) */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-medium">Yes</span>
                  <span className="h-[2px] w-20 bg-green-400 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500">
                    {yesOdds ? `${yesOdds}x` : "--"}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-green-300 text-green-700 text-xs font-semibold min-w-[3rem] text-center">
                    {yesPct !== null ? `${yesPct}%` : "--"}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-medium">No</span>
                  <span className="h-[2px] w-20 bg-blue-500 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500">
                    {noOdds ? `${noOdds}x` : "--"}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-blue-300 text-blue-700 text-xs font-semibold min-w-[3rem] text-center">
                    {noPct !== null ? `${noPct}%` : "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {featuredHistory.length > 0 && (
            <div className="mt-4 h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={featuredHistory}
                  margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
                >
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={[0, 1]} hide />
                  <Tooltip
                    formatter={(v) =>
                      typeof v === "number" ? `${Math.round(v * 100)}%` : v
                    }
                  />
                  <ReferenceLine y={0.2} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <ReferenceLine y={0.4} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <ReferenceLine y={0.6} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <ReferenceLine y={0.8} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <ReferenceLine y={1} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="Yes"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Yes"
                  />
                  <Line
                    type="monotone"
                    dataKey="No"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="No"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Compact binary market card used in the lower grid
const MarketCard = ({ market }: { market: Market }) => {
  const router = useRouter();
  const probs = useFpmmProbabilities(market);
  const yes = probs?.yes ?? 0;
  const no = probs?.no ?? 0;

  const yesPct = yes > 0 ? Math.round(yes * 100) : null;
  const noPct = no > 0 ? Math.round(no * 100) : null;
  const yesOdds = yes > 0 ? (1 / yes).toFixed(2) : null;
  const noOdds = no > 0 ? (1 / no).toFixed(2) : null;

  return (
    <div
      className="bg-white rounded-xl shadow border border-gray-200 p-4 cursor-pointer hover:shadow-md transition"
      onClick={() => router.push(`/markets/${market.id}`)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter") router.push(`/markets/${market.id}`);
      }}
    >
      <div className="flex">
        <div className="flex-1 flex flex-col justify-between">
          {/* Header */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {market.title}
            </h3>
          </div>

          {/* Yes / No rows */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium">Yes</span>
                <span className="h-[2px] w-16 bg-green-400 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500">
                  {yesOdds ? `${yesOdds}x` : "--"}
                </span>
                <span className="px-3 py-1 rounded-full border border-green-300 text-green-700 text-xs font-semibold min-w-[3rem] text-center">
                  {yesPct !== null ? `${yesPct}%` : "--"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium">No</span>
                <span className="h-[2px] w-16 bg-blue-500 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500">
                  {noOdds ? `${noOdds}x` : "--"}
                </span>
                <span className="px-3 py-1 rounded-full border border-blue-300 text-blue-700 text-xs font-semibold min-w-[3rem] text-center">
                  {noPct !== null ? `${noPct}%` : "--"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Trending list on the right side
type TopEvidence = {
  marketId: string;
  title: string;
  netVotes: number;
  url?: string;
};

type EvidenceApiItem = {
  netVotes?: number;
  title?: unknown;
  url?: unknown;
};

const TrendingList = ({ markets }: { markets: Market[] }) => {
  const [topEvidence, setTopEvidence] = useState<TopEvidence[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const entries: TopEvidence[] = [];
        for (const market of markets) {
          const res = await fetch(
            `${API_BASE_URL}/api/evidence?marketId=${market.id}`
          );
          if (!res.ok) continue;
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) continue;
          const typedData = data as EvidenceApiItem[];
          const top = typedData.reduce(
            (best: EvidenceApiItem | null, current: EvidenceApiItem) =>
              best == null || (current?.netVotes ?? 0) > (best?.netVotes ?? 0)
                ? current
                : best,
            null as EvidenceApiItem | null
          );
          if (!top) continue;
          entries.push({
            marketId: market.id,
            title: String(top.title ?? "").trim() || "Untitled evidence",
            netVotes: Number(top.netVotes ?? 0),
            url: typeof top.url === "string" ? top.url : undefined,
          });
        }
        entries.sort((a, b) => b.netVotes - a.netVotes);

        // Always surface up to 7 rows; if fewer than 7 real items,
        // pad with non-clickable placeholders so the card stays full.
        const filled: TopEvidence[] = [...entries.slice(0, 7)];
        while (filled.length < 7) {
          filled.push({
            marketId: "",
            title: "No evidence submitted yet.",
            netVotes: 0,
            url: undefined,
          });
        }
        setTopEvidence(filled);
      } catch (err) {
        console.error("Trending evidence fetch error:", err);
        setTopEvidence([]);
      }
    };
    fetchAll();
  }, [markets]);

  return (
    <div className="space-y-3">
      <aside className="bg-white rounded-2xl p-4 md:p-5 w-full lg:w-80">
          <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Trending Evidence</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {topEvidence.map((entry, idx) => (
            <TrendingRow key={`${entry.marketId || "placeholder"}-${idx}`} index={idx + 1} entry={entry} />
          ))}
        </div>
      </aside>
      <div className="border-t border-gray-200 w-[80%] mx-auto" />
      <NewMarketPanel />
    </div>
  );
};

const TrendingRow = ({
  index,
  entry,
}: {
  index: number;
  entry: TopEvidence;
}) => {
  const router = useRouter();

  const handleClick = () => {
    // Placeholder rows (no marketId) are not clickable
    if (!entry.marketId) return;

    if (entry.url) {
      // Open evidence URL (PDF or web page) in a new tab
      if (typeof window !== "undefined") {
        window.open(entry.url, "_blank", "noopener,noreferrer");
      }
    } else {
      // Fallback: go to the market page
      router.push(`/markets/${entry.marketId}`);
    }
  };

  return (
    <button
      type="button"
      className="w-full py-2.5 flex items-start gap-3 text-left hover:bg-gray-50 rounded-lg"
      onClick={handleClick}
    >
      <span className="w-5 shrink-0 text-xs font-semibold text-gray-500 mt-0.5">
        {index}
      </span>
      <span className="text-xs font-semibold text-gray-900 line-clamp-2 min-w-0">
        {entry.title}
      </span>
    </button>
  );
};

// New Market panel – top proposed markets from Market Ideas page
interface MarketIdeaSummary {
  id: number;
  title: string;
  netVotes: number;
}

const NewMarketPanel = () => {
  const [ideas, setIdeas] = useState<MarketIdeaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/market-ideas`);
        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          const cleaned: MarketIdeaSummary[] = data.map(
            (d: { id: number | string; title?: unknown; netVotes?: number | string }) => ({
              id: Number(d.id),
              title: String(d.title ?? "").trim() || "Untitled market idea",
              netVotes: Number(d.netVotes ?? 0),
            })
          );
          cleaned.sort((a, b) => b.netVotes - a.netVotes);
          setIdeas(cleaned.slice(0, 7));
        } else {
          setIdeas([]);
        }
      } catch (err) {
        console.error("New Market panel fetch error:", err);
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  return (
<aside className="bg-white rounded-2xl p-4 md:p-5 w-full lg:w-80">
        <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Top Proposed Markets</h3>
      </div>
      {loading ? (
        <div className="text-[11px] text-gray-500">Loading ideas...</div>
      ) : ideas.length === 0 ? (
        <div className="text-[11px] text-gray-500">
          No proposed markets yet. Visit the Market Ideas page to suggest one.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {ideas.map((idea, idx) => (
            <div
              key={idea.id}
              className="w-full py-2.5 flex items-start gap-3"
            >
              <span className="w-5 shrink-0 text-xs font-semibold text-gray-500 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-xs font-semibold text-gray-900 line-clamp-2 min-w-0">
                {idea.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

const Homepage = () => {
  // Get all markets
  const markets = getAllMarkets();
  const [featured, ...rest] = markets;
  const secondaryMarkets = rest;

  return (
    <div className="w-full max-w-6xl px-4 md:px-6 lg:px-8 mx-auto pt-2 pb-8">
      {/* Main row: featured + all markets on the left, sidebar on the right */}
      {featured && (
        <div className="mt-2 flex flex-col lg:flex-row gap-6">
          {/* Left column: featured banner and All markets stacked */}
          <div className="flex-1 flex flex-col gap-6">
            <FeaturedMarket market={featured} />
            {secondaryMarkets.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">
                    Markets
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  {secondaryMarkets.map((m) => (
                    <MarketCard key={m.id} market={m} />
                  ))}
                </div>
              </section>
            )}
          </div>
          {/* Right column: Trending Evidence + New Market panels */}
          <div className="w-full lg:w-80">
            <TrendingList markets={markets} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage; 