"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getContract, readContract } from "thirdweb";
import { client } from "../src/client";
import { baseSepolia } from "thirdweb/chains";
import { getAllMarkets, Market } from "../src/data/markets";

// Backend API base URL - use Next.js API routes for both dev and production
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://mvpshell.vercel.app"
    : "";

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
            <div className="text-xs font-semibold tracking-wide text-green-700 mb-1">
              Live market
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {market.title}
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 line-clamp-3">
              {market.description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 items-center">
            <div className="flex flex-col space-y-2">
              <button className="flex items-center justify-between px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100">
                <span className="text-sm font-semibold text-gray-900">
                  {market.outcomes[0]}
                </span>
                <span className="text-lg font-bold text-green-600">
                  {yes > 0 ? `${Math.round(yes * 100)}%` : "--"}
                </span>
              </button>
              <button className="flex items-center justify-between px-3 py-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100">
                <span className="text-sm font-semibold text-gray-900">
                  {market.outcomes[1]}
                </span>
                <span className="text-lg font-bold text-red-600">
                  {no > 0 ? `${Math.round(no * 100)}%` : "--"}
                </span>
              </button>
            </div>
            <div className="hidden md:flex flex-col justify-between text-xs text-gray-500">
              <div className="border border-dashed border-gray-200 rounded-lg px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                  Quick summary
                </div>
                <div className="text-xs text-gray-700 line-clamp-3">
                  Pick a side and see how your beliefs price against the crowd.
                  Trade instantly with on-chain settlement.
                </div>
              </div>
              <div className="mt-3 flex items-center text-[11px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                Markets settle based on WSJ review board decisions.
              </div>
            </div>
          </div>
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
      <div className="flex gap-3">
        {market.id !== "jfk" && (
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <Image
              src={market.image}
              alt={market.title}
              width={160}
              height={160}
              className="w-full h-full object-cover object-top"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
              {market.title}
            </h3>
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {market.description}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="text-[11px] text-gray-500 mb-0.5">
                {market.outcomes[0]}
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                {yes > 0 ? `${Math.round(yes * 100)}%` : "--"}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-gray-500 mb-0.5">
                {market.outcomes[1]}
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                {no > 0 ? `${Math.round(no * 100)}%` : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Trending list on the right side
type TopEvidence = { title: string; netVotes: number } | null;

const TrendingList = ({ markets }: { markets: Market[] }) => {
  const sorted = markets.slice(0, 5); // simple top-5 for now
  const [topEvidenceByMarket, setTopEvidenceByMarket] = useState<
    Record<string, TopEvidence | undefined>
  >({});

  useEffect(() => {
    sorted.forEach((market) => {
      if (topEvidenceByMarket[market.id] !== undefined) return;

      fetch(`${API_BASE_URL}/api/evidence?marketId=${market.id}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
        .then((data) => {
          if (!Array.isArray(data) || data.length === 0) {
            setTopEvidenceByMarket((prev) => ({ ...prev, [market.id]: null }));
            return;
          }
          // Pick evidence with highest netVotes
          const top = data.reduce(
            (best: any, current: any) =>
              best == null || (current?.netVotes ?? 0) > (best?.netVotes ?? 0)
                ? current
                : best,
            null
          );
          if (!top) {
            setTopEvidenceByMarket((prev) => ({ ...prev, [market.id]: null }));
            return;
          }
          setTopEvidenceByMarket((prev) => ({
            ...prev,
            [market.id]: {
              title: String(top.title ?? "").trim() || "Untitled evidence",
              netVotes: Number(top.netVotes ?? 0),
            },
          }));
        })
        .catch((err) => {
          console.error("Trending evidence fetch error:", err);
          setTopEvidenceByMarket((prev) => ({ ...prev, [market.id]: null }));
        });
    });
  }, [sorted, topEvidenceByMarket]);

  return (
    <div className="space-y-4">
      <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5 w-full lg:w-80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Trending Evidence</h3>
          <span className="text-[11px] text-gray-500">
            Most upvoted claims by market
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {sorted.map((m, idx) => (
            <TrendingRow
              key={m.id}
              market={m}
              index={idx + 1}
              evidence={topEvidenceByMarket[m.id]}
            />
          ))}
        </div>
      </aside>
      <NewMarketPanel />
    </div>
  );
};

const TrendingRow = ({
  market,
  index,
  evidence,
}: {
  market: Market;
  index: number;
  evidence: TopEvidence | undefined;
}) => {
  const router = useRouter();

  const subtitle =
    evidence && evidence.title
      ? evidence.title
      : "No evidence submitted yet.";
  const votes =
    evidence && typeof evidence.netVotes === "number"
      ? evidence.netVotes
      : null;

  return (
    <button
      className="w-full flex items-start justify-between py-2.5 text-left hover:bg-gray-50 rounded-lg px-1"
      onClick={() => router.push(`/markets/${market.id}`)}
    >
      <div className="flex items-start gap-3">
        <span className="w-5 text-xs font-semibold text-gray-500 mt-0.5">
          {index}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-900 line-clamp-1">
            {market.title}
          </span>
          <span className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
            {subtitle}
          </span>
        </div>
      </div>
      {votes !== null && (
        <div className="ml-2 flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wide text-gray-400">
            Net votes
          </span>
          <span className="text-xs font-semibold text-gray-800">
            {votes > 0 ? `+${votes}` : votes}
          </span>
        </div>
      )}
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
          const cleaned: MarketIdeaSummary[] = data.map((d: any) => ({
            id: Number(d.id),
            title: String(d.title ?? "").trim() || "Untitled market idea",
            netVotes: Number(d.netVotes ?? 0),
          }));
          cleaned.sort((a, b) => b.netVotes - a.netVotes);
          setIdeas(cleaned.slice(0, 5));
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
    <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5 w-full lg:w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">New Market</h3>
        <span className="text-[11px] text-gray-500">
          Top proposed markets
        </span>
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
            <div key={idea.id} className="py-2.5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="w-5 text-xs font-semibold text-gray-500 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-gray-900 line-clamp-2">
                  {idea.title}
                </span>
              </div>
              <div className="ml-2 flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wide text-gray-400">
                  Net votes
                </span>
                <span className="text-xs font-semibold text-gray-800">
                  {idea.netVotes > 0 ? `+${idea.netVotes}` : idea.netVotes}
                </span>
              </div>
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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center w-full pt-6 pb-10">
      <div className="w-full max-w-6xl px-4 md:px-6 lg:px-8">
        {/* Main row: featured + all markets on the left, sidebar on the right */}
        {featured && (
          <div className="mt-6 flex flex-col lg:flex-row gap-6">
            {/* Left column: featured banner and All markets stacked */}
            <div className="flex-1 flex flex-col gap-6">
              <FeaturedMarket market={featured} />
              {secondaryMarkets.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">
                      All markets
                    </h2>
                    <span className="text-xs text-gray-500">
                      Tap a market to view details and trade.
                    </span>
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
    </div>
  );
};

export default Homepage; 