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
 * One outcome as a cell in the 32px strip along a market's foot, the height of the nav: label and
 * multiplier, then the price in its own ruled cell. A missing price shows a skeleton during the
 * grace period, then "--".
 */
function Outcome({ label, p, side, waiting }: { label: string; p: number; side: "yes" | "no"; waiting: boolean }) {
  const pct = pctOf(p);
  const odds = p > 0 ? (1 / p).toFixed(2) : null;
  const loading = waiting && pct === null;
  return (
    <div className="flex h-8 items-stretch text-small">
      <span className="flex flex-1 items-center gap-2 px-3 sm:px-5">
        <span className="font-medium text-ink">{label}</span>
        {loading ? <span className="skeleton h-3 w-8" /> : <span className="num text-muted">{odds ? `${odds}x` : "--"}</span>}
      </span>
      <span className={`num flex min-w-14 items-center justify-center border-l border-ink px-2.5 font-semibold ${side === "yes" ? "text-yes" : "text-no"}`}>
        {loading ? <span className="skeleton h-3 w-7" /> : pct !== null ? `${pct}%` : "--"}
      </span>
    </div>
  );
}

/**
 * The lead story in one ruled box: the featured market set like a front-page headline (under its
 * picture when it has one), the two outcomes in cells, then the price history. The top part is the link.
 */
export function FeaturedMarket({ market, probs }: { market: Market; probs: Probs }) {
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

  // As on the original front page, these two markets lead without their picture.
  const cover = market.id !== "jfk" && market.id !== "covid19";

  return (
    <article className="border border-ink">
      <Link href={`/markets/${market.id}`} className="group block">
        {cover && (
          <Image
            src={market.image}
            alt={market.title}
            width={1280}
            height={800}
            className="aspect-[16/9] w-full border-b border-ink object-cover object-top contrast-[1.06] grayscale"
          />
        )}
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="serif [text-wrap:pretty] text-[clamp(30px,4vw,44px)] font-medium leading-[1.04] tracking-[-0.02em] text-ink decoration-2 underline-offset-[6px] group-hover:underline">
            {market.title}
          </h2>
          {market.description && <p className="serif mt-3 max-w-[60ch] text-[clamp(16px,1.4vw,19px)] leading-[1.45] text-ink-2">{market.description}</p>}
        </div>
        <div className="grid grid-cols-2 divide-x divide-ink border-t border-ink">
          <Outcome label="Yes" p={probs?.yes ?? 0} side="yes" waiting={waiting} />
          <Outcome label="No" p={probs?.no ?? 0} side="no" waiting={waiting} />
        </div>
      </Link>
      {featuredHistory.length > 0 && (
        <div className="border-t border-ink px-5 pb-3 pt-5 sm:px-7">
          <OddsChart data={featuredHistory} height={220} detailed={false} />
        </div>
      )}
    </article>
  );
}

/**
 * One market in the list as a boxed card: the question, then the description with the arrow, then
 * the two outcomes in cells along the foot. The card is the link.
 */
export function MarketCard({ market, probs }: { market: Market; probs: Probs }) {
  const waiting = useGrace() && probs === null;
  return (
    <li>
      <Link
        href={`/markets/${market.id}`}
        className="group flex h-full flex-col border border-ink transition-colors duration-150 hover:bg-ground-2"
      >
        <h3 className="serif border-b border-ink p-5 text-[24px] font-medium leading-tight tracking-[-0.01em] text-ink [text-wrap:pretty] decoration-1 underline-offset-4 group-hover:underline">
          {market.title}
        </h3>
        <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
          {market.description && <p className="serif text-[16px] leading-snug text-ink-2">{market.description}</p>}
          <span aria-hidden className="mt-auto self-end pt-6 text-lead text-ink transition-transform duration-150 group-hover:translate-x-1">
            →
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-ink border-t border-ink">
          <Outcome label="Yes" p={probs?.yes ?? 0} side="yes" waiting={waiting} />
          <Outcome label="No" p={probs?.no ?? 0} side="no" waiting={waiting} />
        </div>
      </Link>
    </li>
  );
}
