"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAllMarkets, type Market } from "../src/data/markets";
import { fetchFpmmProbsForMarket } from "../src/lib/fpmmMarketOdds";
import { FeaturedMarket, MarketRow } from "../src/components/market/MarketCard";
import { SkeletonLines } from "../src/components/ui/Skeleton";

const API_BASE_URL = "";

type TopEvidence = { marketId: string; title: string; netVotes: number; url?: string };
type EvidenceApiItem = { netVotes?: number; title?: unknown; url?: unknown };

/** Ranked across every listed market; the number is the rank. */
const TrendingEvidence = ({ markets }: { markets: Market[] }) => {
  const [topEvidence, setTopEvidence] = useState<TopEvidence[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const entries: TopEvidence[] = [];
        for (const market of markets) {
          const res = await fetch(`${API_BASE_URL}/api/evidence?marketId=${market.id}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) continue;
          const typedData = data as EvidenceApiItem[];
          // Push ALL evidence items for this market so we can rank
          // the globally most-upvoted evidence across all visible markets.
          for (const ev of typedData) {
            entries.push({
              marketId: market.id,
              title: String(ev.title ?? "").trim() || "Untitled evidence",
              netVotes: Number(ev.netVotes ?? 0),
              url: typeof ev.url === "string" ? ev.url : undefined,
            });
          }
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
    <section aria-labelledby="trending-heading">
      <h2 id="trending-heading" className="kicker font-mono">
        Trending Evidence
      </h2>
      <ol className="mt-1">
        {topEvidence.map((e, i) => {
          const cls = "group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-b border-dotted border-rule py-3 transition-colors duration-150 hover:bg-ground-2";
          const inner = (
            <>
              <span className="serif num text-[20px] font-extrabold leading-none text-muted">{i + 1}</span>
              <span className={`serif line-clamp-3 text-[15px] font-semibold leading-snug ${e.marketId ? "text-ink" : "text-muted"}`}>{e.title}</span>
            </>
          );
          return (
            <li key={`${e.marketId || "placeholder"}-${i}`}>
              {/* Placeholder rows (no marketId) are not clickable */}
              {!e.marketId ? (
                <div className={cls}>{inner}</div>
              ) : e.url ? (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={`/markets/${e.marketId}`} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

interface MarketIdeaSummary {
  id: number;
  title: string;
  netVotes: number;
}

const TopProposedMarkets = () => {
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
    <section aria-labelledby="proposed-heading">
      <h2 id="proposed-heading" className="kicker font-mono">
        Top Proposed Markets
      </h2>
      {loading ? (
        <div className="mt-4">
          <span className="sr-only">Loading ideas...</span>
          <SkeletonLines rows={4} />
        </div>
      ) : ideas.length === 0 ? (
        <p className="mt-3 text-small text-muted">No proposed markets yet. Visit the Market Ideas page to suggest one.</p>
      ) : (
        <ol className="mt-1">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Link href="/market-ideas" className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-dotted border-rule py-3 transition-colors duration-150 hover:bg-ground-2">
                <span className="serif line-clamp-3 text-[15px] font-semibold leading-snug text-ink">{idea.title}</span>
                <span className="num text-small text-muted">{idea.netVotes}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

/**
 * The front page: the featured market as the lead story with trending evidence and proposals
 * in the side column, then every listed market as a row in one index.
 */
const Homepage = () => {
  const markets = getAllMarkets();
  const [featured] = markets;
  // Single fetch of odds for all markets once on mount (same idea as markets/[id] page).
  const [marketOdds, setMarketOdds] = useState<Record<string, { yes: number; no: number }>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await Promise.all(
        markets.map(async (m) => ({ id: m.id, probs: await fetchFpmmProbsForMarket(m) }))
      );
      if (cancelled) return;
      const next: Record<string, { yes: number; no: number }> = {};
      for (const { id, probs } of all) {
        if (probs) next[id] = probs;
      }
      setMarketOdds(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fetch once on mount; markets from getAllMarkets() is static

  return (
    <div className="container-page pb-24 pt-8 md:pt-10">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-0">
        <div className="min-w-0 lg:pr-10">{featured && <FeaturedMarket market={featured} probs={marketOdds[featured.id] ?? null} />}</div>
        <aside className="flex flex-col gap-10 lg:border-l lg:border-rule lg:pl-8">
          <TrendingEvidence markets={markets} />
          <TopProposedMarkets />
        </aside>
      </div>

      <section aria-labelledby="markets-heading" className="mt-16">
        <h1 id="markets-heading" className="serif border-b border-ink pb-2 text-[clamp(26px,2.4vw,34px)] font-extrabold tracking-[-0.02em] text-ink">
          Markets
        </h1>
        <ul>
          {markets.map((m) => (
            <MarketRow key={m.id} market={m} probs={marketOdds[m.id] ?? null} />
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Homepage;
