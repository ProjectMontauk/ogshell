"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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

/** One outcome on the lead story: label, a track filled to the price, the multiplier and the price. */
function Outcome({ label, p, side, waiting }: { label: string; p: number; side: "yes" | "no"; waiting: boolean }) {
  const pct = pctOf(p);
  if (waiting && pct === null) {
    return (
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_3.5rem] items-center gap-3 border-b border-dotted border-rule py-2.5 text-body sm:grid-cols-[3rem_minmax(0,1fr)_4rem_4rem] sm:gap-4">
        <span className={`font-semibold ${side === "yes" ? "text-yes" : "text-no"}`}>{label}</span>
        <span className="skeleton h-2" />
        <span className="skeleton ml-auto h-3.5 w-10" />
        <span className="skeleton ml-auto h-5 w-12" />
      </div>
    );
  }
  const odds = p > 0 ? (1 / p).toFixed(2) : null;
  const color = side === "yes" ? "text-yes" : "text-no";
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_3.5rem] items-center gap-3 border-b border-dotted border-rule py-2.5 text-body sm:grid-cols-[3rem_minmax(0,1fr)_4rem_4rem] sm:gap-4">
      <span className={`font-semibold ${color}`}>{label}</span>
      <span className="relative h-2 shadow-[inset_0_0_0_1px_var(--rule)]">
        <span className={`absolute inset-y-0 left-0 ${side === "yes" ? "bg-yes" : "bg-no"} transition-[width] duration-700 ease-out-quart`} style={{ width: `${pct ?? 0}%` }} />
      </span>
      <span className="num text-right text-muted">{odds ? `${odds}x` : "--"}</span>
      <span className={`serif num text-right text-[22px] font-semibold leading-none ${color}`}>{pct !== null ? `${pct}%` : "--"}</span>
    </div>
  );
}

/**
 * The lead story: the featured market set like a front-page headline, its question, the two
 * outcomes and the price history. The headline is the link.
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

  return (
    <article>
      <Link href={`/markets/${market.id}`} className="group block">
        <h2 className="serif [text-wrap:pretty] text-[clamp(40px,6vw,78px)] font-extrabold leading-[0.93] tracking-[-0.035em] text-ink decoration-[3px] underline-offset-8 group-hover:underline">
          {market.title}
        </h2>
      </Link>
      {market.description && <p className="serif mt-4 max-w-[58ch] text-[clamp(17px,1.5vw,20px)] leading-[1.45] text-ink-2">{market.description}</p>}
      <div className="mt-6">
        <Outcome label="Yes" p={probs?.yes ?? 0} side="yes" waiting={waiting} />
        <Outcome label="No" p={probs?.no ?? 0} side="no" waiting={waiting} />
      </div>
      {featuredHistory.length > 0 && (
        <div className="mt-5">
          <OddsChart data={featuredHistory} height={160} detailed={false} />
        </div>
      )}
    </article>
  );
}

/** One market in the list: question and description on the left, the split on the right. The row is the link. */
export function MarketRow({ market, probs }: { market: Market; probs: Probs }) {
  const waiting = useGrace() && probs === null;
  const yes = pctOf(probs?.yes ?? 0);
  const no = pctOf(probs?.no ?? 0);
  return (
    <li>
      <Link
        href={`/markets/${market.id}`}
        className="group grid grid-cols-[minmax(0,1fr)_1.5rem] items-center gap-x-6 gap-y-3 border-b border-dotted border-rule py-5 transition-colors duration-150 hover:bg-ground-2 md:grid-cols-[minmax(0,1fr)_220px_1.5rem]"
      >
        <div className="min-w-0">
          <h3 className="serif text-[22px] font-bold leading-tight text-ink">{market.title}</h3>
          {market.description && <p className="serif mt-1 line-clamp-2 text-[15px] leading-snug text-ink-2">{market.description}</p>}
        </div>
        <div className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
          {waiting ? (
            <>
              <div className="flex justify-between">
                <span className="skeleton h-4 w-16" />
                <span className="skeleton h-4 w-16" />
              </div>
              <div className="skeleton mt-1.5 h-1.5" />
            </>
          ) : (
            <>
              <div className="num flex justify-between text-body font-semibold">
                <span className="text-yes">Yes {yes ?? "--"}%</span>
                <span className="text-no">No {no ?? "--"}%</span>
              </div>
              <div className="mt-1.5 flex h-1.5 shadow-[0_0_0_1px_var(--ink)]">
                <span className="bg-yes" style={{ flex: probs?.yes ?? 0.5 }} />
                <span className="bg-no" style={{ flex: probs?.no ?? 0.5 }} />
              </div>
            </>
          )}
        </div>
        <span aria-hidden className="col-start-2 row-start-1 justify-self-end text-lead text-muted transition-[transform,color] duration-150 group-hover:translate-x-1 group-hover:text-ink md:col-start-auto md:row-start-auto">
          →
        </span>
      </Link>
    </li>
  );
}
