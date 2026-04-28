"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getMarketById } from "@/data/markets";
import type { Market } from "@/data/markets";
import { useTheme } from "@/contexts/ThemeContext";
import {
  fetchFpmmProbsForMarket,
  ODDS_HISTORY_FIXED_POINT,
} from "@/lib/fpmmMarketOdds";

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
 * Same data + chart behavior as `FeaturedMarket` in `components/Homepage.tsx`.
 * Styling adds `dark:` variants so the card reads correctly inside `?embed=1&theme=dark`.
 */
export default function MarketCardEmbed({
  marketId,
  apiBase,
}: {
  marketId: string;
  apiBase?: string;
}) {
  const market = getMarketById(marketId) as Market | undefined;
  const { resolved: themeResolved } = useTheme();
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
  const chartGridStroke = themeResolved === "dark" ? "#52525b" : "#e5e7eb";
  const chartLineYes = themeResolved === "dark" ? "#00e889" : "#22c55e";
  const chartLineNo = themeResolved === "dark" ? "#3b82f6" : "#2563eb";

  const yesPct = yes > 0 ? Math.round(yes * 100) : null;
  const noPct = no > 0 ? Math.round(no * 100) : null;
  const yesOdds = yes > 0 ? (1 / yes).toFixed(2) : null;
  const noOdds = no > 0 ? (1 / no).toFixed(2) : null;

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-[#0f121a] rounded-2xl shadow border border-gray-200 dark:border-white/10 p-5 md:p-6 lg:p-7">
        <div className="flex flex-col lg:flex-row gap-5">
          {market.id !== "jfk" && market.id !== "covid19" && (
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
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {market.title}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-300 mb-4 line-clamp-3">
                {market.description}
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 dark:text-zinc-100 font-medium">Yes</span>
                    <span className="h-[2px] w-20 bg-green-400 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                      {yesOdds ? `${yesOdds}x` : "--"}
                    </span>
                    <span className="px-3 py-1 rounded-full border border-green-300 dark:border-[#00e889]/50 text-green-700 dark:text-[#00e889] text-xs font-semibold min-w-[3rem] text-center">
                      {yesPct !== null ? `${yesPct}%` : "--"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 dark:text-zinc-100 font-medium">No</span>
                    <span className="h-[2px] w-20 bg-blue-500 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                      {noOdds ? `${noOdds}x` : "--"}
                    </span>
                    <span className="px-3 py-1 rounded-full border border-blue-300 dark:border-[#3b82f6]/50 text-blue-700 dark:text-[#3b82f6] text-xs font-semibold min-w-[3rem] text-center">
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
                      contentStyle={
                        themeResolved === "dark"
                          ? {
                              backgroundColor: "#16191e",
                              border: "1px solid #2a2f38",
                              borderRadius: "8px",
                              color: "#f8fafc",
                            }
                          : undefined
                      }
                    />
                    <ReferenceLine y={0.2} stroke={chartGridStroke} strokeDasharray="4 4" />
                    <ReferenceLine y={0.4} stroke={chartGridStroke} strokeDasharray="4 4" />
                    <ReferenceLine y={0.6} stroke={chartGridStroke} strokeDasharray="4 4" />
                    <ReferenceLine y={0.8} stroke={chartGridStroke} strokeDasharray="4 4" />
                    <ReferenceLine y={1} stroke={chartGridStroke} strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="Yes"
                      stroke={chartLineYes}
                      strokeWidth={2}
                      dot={false}
                      name="Yes"
                    />
                    <Line
                      type="monotone"
                      dataKey="No"
                      stroke={chartLineNo}
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
    </div>
  );
}
