"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getMarketById } from "@/data/markets";
import type { Market } from "@/data/markets";
import {
  fetchFpmmProbsForMarket,
  ODDS_HISTORY_FIXED_POINT,
} from "@/lib/fpmmMarketOdds";
import OddsChart from "@/components/market/OddsChart";

function normalizeApiBase(raw: string | undefined) {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    u.pathname = "";
    u.search = "";
    u.hash = "";
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Partner card. Data loading is the original's; only the markup is the broadsheet card
 * (the theme tokens already cover `?embed=1&theme=dark`).
 */
export default function MarketCardEmbed({
  marketId,
  apiBase,
}: {
  marketId: string;
  apiBase?: string;
}) {
  const market = getMarketById(marketId) as Market | undefined;
  const apiOrigin = useMemo(() => normalizeApiBase(apiBase), [apiBase]);

  const [probs, setProbs] = useState<{ yes: number; no: number } | null>(null);
  const [featuredHistory, setFeaturedHistory] = useState<
    { timestamp: string; Yes: number; No: number }[]
  >([]);

  useEffect(() => {
    // This runs inside the iframe. Ensure the iframe doesn't show internal scrollbars.
    try {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.margin = "0";
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!market) return;
    let cancelled = false;
    (async () => {
      const p = await fetchFpmmProbsForMarket(market);
      if (!cancelled) setProbs(p);
    })();
    return () => {
      cancelled = true;
    };
  }, [market]);

  useEffect(() => {
    if (!market) return;
    let cancelled = false;

    const mapHistory = (
      data: unknown
    ): { timestamp: string; Yes: number; No: number }[] => {
      if (!Array.isArray(data)) return [];
      const sliced = data.slice(-40);
      return sliced.map(
        (entry: {
          timestamp: string | number | Date;
          yesProbability?: number;
          noProbability?: number;
        }) => ({
          timestamp: new Date(entry.timestamp).toISOString().slice(5, 10),
          Yes:
            typeof entry.yesProbability === "number"
              ? entry.yesProbability / ODDS_HISTORY_FIXED_POINT
              : 0,
          No:
            typeof entry.noProbability === "number"
              ? entry.noProbability / ODDS_HISTORY_FIXED_POINT
              : 0,
        })
      );
    };

    const run = async () => {
      try {
        const localUrl = `/api/odds-history?marketId=${encodeURIComponent(market.id)}`;
        const res = await fetch(localUrl);
        if (!res.ok) throw new Error(`odds-history ${res.status}`);
        const data = await res.json();
        let chart = mapHistory(data);

        if (!chart.length && apiOrigin) {
          const remoteUrl = `${apiOrigin}/api/odds-history?marketId=${encodeURIComponent(market.id)}`;
          const res2 = await fetch(remoteUrl);
          if (!res2.ok) throw new Error(`odds-history(remote) ${res2.status}`);
          const data2 = await res2.json();
          chart = mapHistory(data2);
        }

        if (!cancelled) setFeaturedHistory(chart);
      } catch (e) {
        console.error("Embed featured odds history error:", e);
        if (!cancelled) setFeaturedHistory([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [apiOrigin, market]);

  if (!market) return null;

  const yes = probs?.yes ?? 0;
  const no = probs?.no ?? 0;

  const yesPct = yes > 0 ? Math.round(yes * 100) : null;
  const noPct = no > 0 ? Math.round(no * 100) : null;
  const yesOdds = yes > 0 ? (1 / yes).toFixed(2) : null;
  const noOdds = no > 0 ? (1 / no).toFixed(2) : null;

  const outcomes = [
    { label: "Yes", odds: yesOdds, pct: yesPct, side: "yes" as const },
    { label: "No", odds: noOdds, pct: noPct, side: "no" as const },
  ];

  return (
    <div className="w-full bg-ground p-4 text-ink">
      <div className="flex flex-col gap-5 border-t-2 border-ink pt-4 lg:flex-row">
        {market.id !== "jfk" && market.id !== "covid19" && (
          <div className="lg:w-2/5">
            <Image
              src={market.image}
              alt={market.title}
              width={640}
              height={360}
              className="h-52 w-full object-cover object-top md:h-64 lg:h-60"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h2 className="serif text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-ink">{market.title}</h2>
            <p className="serif mt-2 line-clamp-3 text-[15px] leading-snug text-ink-2">{market.description}</p>
            <div className="mt-3">
              {outcomes.map((o) => (
                <div key={o.label} className="grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-3 border-b border-dotted border-rule py-1.5 text-small">
                  <span className={`font-semibold ${o.side === "yes" ? "text-yes" : "text-no"}`}>{o.label}</span>
                  <span className={`h-[2px] w-20 ${o.side === "yes" ? "bg-yes" : "bg-no"}`} />
                  <span className="num text-muted">{o.odds ? `${o.odds}x` : "--"}</span>
                  <span className={`serif num min-w-[3rem] text-right text-[18px] font-bold ${o.side === "yes" ? "text-yes" : "text-no"}`}>
                    {o.pct !== null ? `${o.pct}%` : "--"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {featuredHistory.length > 0 && (
            <div className="mt-4 w-full">
              <OddsChart data={featuredHistory} height={96} detailed={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
