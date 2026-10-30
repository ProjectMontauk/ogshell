"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAllMarkets, type Market } from "../src/data/markets";
import { fetchFpmmProbsForMarket } from "../src/lib/fpmmMarketOdds";
import { FeaturedMarket, MarketLine, MarketRow, MarketStory } from "../src/components/market/MarketCard";
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
      <h2 id="trending-heading" className="serif border-b lg:-ml-7 lg:pl-7 border-ink pb-2 text-[20px] font-bold leading-tight tracking-[-0.01em] text-ink">
        Trending Evidence
      </h2>
      <ol className="mt-1">
        {topEvidence.map((e, i) => {
          const cls = "group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-b border-rule py-3.5 transition-colors lg:-ml-7 lg:pl-7 duration-150 hover:bg-ground-2";
          const inner = (
            <>
              <span className="serif num text-[22px] font-normal leading-none text-muted">{i + 1}</span>
              <span className={`serif line-clamp-3 text-[16px] font-bold leading-snug ${e.marketId ? "text-ink group-hover:underline" : "text-muted"}`}>{e.title}</span>
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
      <h2 id="proposed-heading" className="serif border-b lg:-ml-7 lg:pl-7 border-ink pb-2 text-[20px] font-bold leading-tight tracking-[-0.01em] text-ink">
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
              <Link href="/market-ideas" className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-rule py-3.5 transition-colors lg:-ml-7 lg:pl-7 duration-150 hover:bg-ground-2">
                <span className="serif line-clamp-3 text-[16px] font-bold leading-snug text-ink group-hover:underline">{idea.title}</span>
                <span className="num text-small text-muted">{idea.netVotes}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

/** Single fetch of odds for all markets once on mount (same idea as markets/[id] page). */
function useMarketOdds(markets: Market[]) {
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

  return (id: string) => marketOdds[id] ?? null;
}

const heading = "serif border-b border-ink pb-2 text-[20px] font-bold leading-tight tracking-[-0.01em] text-ink";

/**
 * The front page, made up as a broadsheet's is: the featured market as the lead package, three
 * stories with their pictures under it, six briefs in two columns, and trending evidence and
 * proposals in a ruled column on the right. Everything else is on the markets index. On phones it
 * is one column in reading order, the lead first.
 */
const Homepage = () => {
  const markets = getAllMarkets();
  const odds = useMarketOdds(markets);
  const [featured, ...rest] = markets;
  // First four secondary markets as a 2×2 story grid; any further markets as brief rows.
  const stories = rest.slice(0, 4);
  const briefs = rest.slice(4, 10);

  // On large screens three columns, 272 : 580 : 332 at full width. The main section spans the first
  // two and lays its children on the same lines (subgrid), so the lead's text and picture fall on
  // the page's columns.
  return (
    <div className="container-page pb-24 pt-8">
      <div className="grid gap-12 lg:grid-cols-[272fr_580fr_332fr] lg:gap-x-7 lg:gap-y-0">
        <section aria-label="Markets" className="min-w-0 lg:col-span-2 lg:grid lg:grid-cols-subgrid lg:content-start">
          {featured && <FeaturedMarket market={featured} probs={odds(featured.id)} className="lg:col-span-2" />}
          {stories.length > 0 && (
            <div className="mt-7 grid gap-x-7 gap-y-8 border-t border-rule pt-6 sm:grid-cols-2 lg:col-span-2">
              {stories.map((m) => (
                <MarketStory key={m.id} market={m} probs={odds(m.id)} />
              ))}
            </div>
          )}
          {briefs.length > 0 && (
            <ul className="mt-7 grid gap-x-7 border-t border-rule sm:grid-cols-2 lg:col-span-2">
              {briefs.map((m) => (
                <MarketRow key={m.id} market={m} probs={odds(m.id)} />
              ))}
            </ul>
          )}
        </section>
        <aside className="flex flex-col gap-10 lg:border-l lg:border-rule lg:pl-7">
          <TrendingEvidence markets={markets} />
          <TopProposedMarkets />
        </aside>
      </div>
    </div>
  );
};

/** The markets index: every listed market as a numbered, ruled row, in listing order. */
export const MarketsIndex = () => {
  const markets = getAllMarkets();
  const odds = useMarketOdds(markets);

  return (
    <div className="container-page pb-24 pt-8">
      <h1 className={heading}>Markets</h1>
      <ol>
        {markets.map((m, i) => (
          <MarketLine key={m.id} market={m} probs={odds(m.id)} n={i + 1} />
        ))}
      </ol>
    </div>
  );
};

export default Homepage;
