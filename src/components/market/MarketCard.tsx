"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Market } from "@/data/markets";
import OddsChart, { type OddsPoint } from "./OddsChart";
import { ODDS_HISTORY_FIXED_POINT } from "@/lib/fpmmMarketOdds";

const API_BASE_URL = "";

type Probs = { yes: number; no: number } | null;

const pctOf = (p: number) => (p > 0 ? Math.round(p * 100) : null);

/**
 * True for the first few seconds after mount. The page has no "still loading" flag for prices
 * (a missing price means loading or failed), so a missing price shows a skeleton only for this
 * grace period and then falls back to "--", as the original did.
 */
function useGrace(ms = 6000) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return on;
}

/**
 * One outcome's reading in its colour, "Yes 47%", with the multiplier beside it; the same words as the
 * original pills. A missing price shows a skeleton during the grace period, then "--".
 */
function Outcome({ label, p, side, waiting }: { label: string; p: number; side: "yes" | "no"; waiting: boolean }) {
  const pct = pctOf(p);
  const odds = p > 0 ? (1 / p).toFixed(2) : null;
  const loading = waiting && pct === null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${side === "yes" ? "text-yes" : "text-no"}`}>
      <span>{label}</span>
      {loading ? <span className="skeleton h-3 w-7" /> : <span>{pct !== null ? `${pct}%` : "--"}</span>}
      {loading ? <span className="skeleton h-3 w-8" /> : <span className="text-muted">{odds ? `${odds}x` : "--"}</span>}
    </span>
  );
}

/**
 * The Yes and No outcomes of a market as a ruled scale: a hairline split at the Yes price, green for
 * Yes and blue for No with a tick at the split, and the two readings under its ends. Without a price
 * the line is a plain rule. The readings sit at either end when the column has room for both (14rem)
 * and one above the other when it does not, so every card in a column breaks the same way.
 */
function Outcomes({ probs, waiting, className = "" }: { probs: Probs; waiting: boolean; className?: string }) {
  const yes = probs?.yes ?? 0;
  const split = yes > 0 ? `${Math.min(100, yes * 100)}%` : null;
  return (
    <div className={`@container ${className}`}>
      <div className="num text-small">
        <div className="relative flex h-0.5 bg-rule">
          {split && (
            <>
              <span className="bg-yes" style={{ width: split }} />
              <span className="flex-1 bg-no" />
              <span className="absolute -top-1 h-2.5 w-px bg-ink" style={{ left: split }} />
            </>
          )}
        </div>
        <div className="mt-1.5 flex flex-col items-start gap-1 @min-[14rem]:flex-row @min-[14rem]:justify-between @min-[14rem]:gap-x-4">
          <Outcome label="Yes" p={yes} side="yes" waiting={waiting} />
          <Outcome label="No" p={probs?.no ?? 0} side="no" waiting={waiting} />
        </div>
      </div>
    </div>
  );
}

/**
 * The lead story as a front-page package: the question as the headline with its description, the
 * two outcomes and the price history in the first column, and its picture across the wide column
 * beside them. On narrower screens the picture comes first. Picture and headline both link to the
 * market. On a page grid the package spans two columns and takes their widths from it.
 */
export function FeaturedMarket({ market, probs, className = "" }: { market: Market; probs: Probs; className?: string }) {
  const waiting = useGrace() && probs === null;
  // Mini odds history chart data for featured market (as on main: last 40 points, shown once loaded).
  const [featuredHistory, setFeaturedHistory] = useState<OddsPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/odds-history?marketId=${market.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const sliced = data.slice(-40);
        const chart = sliced.map(
          (entry: { timestamp: string | number | Date; yesProbability?: number; noProbability?: number }) => ({
            // ISO date rather than main's MM-DD label: the chart formats its own date labels.
            timestamp: new Date(entry.timestamp).toISOString().slice(0, 10),
            Yes: typeof entry.yesProbability === "number" ? entry.yesProbability / ODDS_HISTORY_FIXED_POINT : 0,
            No: typeof entry.noProbability === "number" ? entry.noProbability / ODDS_HISTORY_FIXED_POINT : 0,
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

  return (
    <article className={`xl:grid xl:grid-cols-subgrid ${className}`}>
      <Link href={`/markets/${market.id}`} className="block xl:col-start-2 xl:row-start-1">
        <Image src={market.image} alt={market.title} width={1280} height={800} priority className="aspect-[16/9] w-full object-cover object-top" />
      </Link>
      <div className="mt-5 xl:col-start-1 xl:row-start-1 xl:mt-0">
        <Link href={`/markets/${market.id}`} className="group block">
          <h2 className="serif [text-wrap:pretty] text-[32px] font-bold leading-[1.06] tracking-[-0.01em] text-ink decoration-2 underline-offset-[6px] group-hover:underline xl:text-[34px]">
            {market.title}
          </h2>
          {market.description && <p className="serif mt-2.5 text-[16px] leading-[1.4] text-ink-2">{market.description}</p>}
        </Link>
        <Outcomes probs={probs} waiting={waiting} className="mt-3" />
        {featuredHistory.length > 0 && (
          <div className="mt-4">
            <OddsChart data={featuredHistory} height={124} detailed={false} />
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * A second-rank story under the lead: the question, two lines of the description and the two
 * outcomes. The headline is the link (no picture).
 */
export function MarketStory({ market, probs }: { market: Market; probs: Probs }) {
  const waiting = useGrace() && probs === null;
  return (
    <article>
      <Link href={`/markets/${market.id}`} className="group block">
        <h3 className="serif text-[22px] font-bold leading-[1.12] tracking-[-0.01em] text-ink [text-wrap:pretty] decoration-1 underline-offset-4 group-hover:underline">
          {market.title}
        </h3>
        {market.description && <p className="serif mt-1.5 line-clamp-2 text-[15px] leading-[1.35] text-ink-2">{market.description}</p>}
      </Link>
      <Outcomes probs={probs} waiting={waiting} className="mt-3" />
    </article>
  );
}

/**
 * One market as a front-page brief: the question, two lines of its description, and the two
 * outcomes at the foot of the cell so they line up across a row. The item is the link.
 */
export function MarketRow({ market, probs }: { market: Market; probs: Probs }) {
  const waiting = useGrace() && probs === null;
  return (
    <li>
      <Link href={`/markets/${market.id}`} className="group flex h-full flex-col border-b border-rule py-5">
        <h3 className="serif text-[20px] font-bold leading-[1.15] tracking-[-0.01em] text-ink [text-wrap:pretty] decoration-1 underline-offset-4 group-hover:underline">
          {market.title}
        </h3>
        {market.description && <p className="serif mt-1.5 line-clamp-2 text-[15px] leading-[1.35] text-ink-2">{market.description}</p>}
        <Outcomes probs={probs} waiting={waiting} className="mt-auto pt-3" />
      </Link>
    </li>
  );
}

/**
 * One market in the index: its number in the listing, the question and two lines of its description,
 * and the two outcomes in a column of their own on the right (under the text on phones). The row is
 * the link.
 */
export function MarketLine({ market, probs, n }: { market: Market; probs: Probs; n: number }) {
  const waiting = useGrace() && probs === null;
  return (
    <li>
      <Link
        href={`/markets/${market.id}`}
        className="group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-rule py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_16rem] sm:gap-x-7"
      >
        <span className="serif num text-[22px] leading-none text-muted">{n}</span>
        <div className="min-w-0 max-w-[64ch]">
          <h3 className="serif text-[22px] font-bold leading-[1.12] tracking-[-0.01em] text-ink [text-wrap:pretty] decoration-1 underline-offset-4 group-hover:underline">
            {market.title}
          </h3>
          {market.description && <p className="serif mt-1.5 line-clamp-2 text-[15px] leading-[1.35] text-ink-2">{market.description}</p>}
        </div>
        <Outcomes probs={probs} waiting={waiting} className="col-start-2 mt-3 sm:col-start-3 sm:row-start-1 sm:mt-1.5" />
      </Link>
    </li>
  );
}
