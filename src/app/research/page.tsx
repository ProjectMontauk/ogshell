"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../../components/Navbar";
import PageShell from "@/components/ui/PageShell";
import { SkeletonLines } from "../../components/ui/Skeleton";

interface AgentTrade {
  id: number;
  walletAddress: string;
  marketId: string;
  marketTitle: string;
  action: "BUY" | "SELL" | string;
  outcome: "Yes" | "No" | string;
  shares: number;
  amountUsd: number;
  avgPrice: number;
  txHash: string | null;
  agentProbability: number; // LLM's estimate that the market resolves Yes (0-1)
  marketYesPrice: number; // market Yes price when the agent decided (0-1)
  edge: number; // gap on the side traded (0-1)
  confidence: "low" | "medium" | "high" | string;
  reasoning: string;
  model: string | null;
  createdAt: string;
}

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
const usd = (x: number) => `$${x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortAddress = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export default function ResearchPage() {
  const [trades, setTrades] = useState<AgentTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/research?_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setTrades(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load research");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markets = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of trades) if (!seen.has(t.marketId)) seen.set(t.marketId, t.marketTitle);
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [trades]);

  const visible = useMemo(() => (marketFilter === "all" ? trades : trades.filter((t) => t.marketId === marketFilter)), [trades, marketFilter]);

  const totals = useMemo(() => {
    const bought = visible.filter((t) => t.action === "BUY").reduce((sum, t) => sum + t.amountUsd, 0);
    const sold = visible.filter((t) => t.action === "SELL").reduce((sum, t) => sum + t.amountUsd, 0);
    return { count: visible.length, bought, sold };
  }, [visible]);

  return (
    <div>
      <Navbar />
      <PageShell
        width="medium"
        title="Research"
        note="Automated agents estimate the probability of each claim with an LLM, then buy the side they think is underpriced and sell the side they think is overpriced. Every automated trade is recorded here with the evaluation behind it."
      >
        {loading ? (
          <>
            <p className="sr-only">Loading automated trades...</p>
            <SkeletonLines rows={5} className="py-4" />
          </>
        ) : error ? (
          <p role="alert" className="py-4 text-body text-danger">
            {error}
          </p>
        ) : trades.length === 0 ? (
          <p className="py-4 text-body text-muted">No automated trades yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-1 text-small text-muted">
              <span>
                Trades <span className="num text-ink">{totals.count}</span>
              </span>
              <span>
                Bought <span className="num text-ink">{usd(totals.bought)}</span>
              </span>
              <span>
                Sold <span className="num text-ink">{usd(totals.sold)}</span>
              </span>
            </div>

            {markets.length > 1 && (
              <div role="tablist" aria-label="Filter by market" className="tabs mt-5 flex-wrap">
                <button role="tab" type="button" aria-selected={marketFilter === "all"} onClick={() => setMarketFilter("all")} className="tab">
                  All markets
                </button>
                {markets.map((m) => (
                  <button key={m.id} role="tab" type="button" aria-selected={marketFilter === m.id} onClick={() => setMarketFilter(m.id)} className="tab">
                    {m.title}
                  </button>
                ))}
              </div>
            )}

            <h2 className="kicker mt-6">Automated trades</h2>
            <ol className="row-list">
              {visible.map((t) => {
                const isBuy = t.action === "BUY";
                const sideColor = t.outcome === "Yes" ? "text-yes" : "text-no";
                return (
                  <li key={t.id} className="row-hover border-b border-dotted border-rule py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <Link href={`/markets/${t.marketId}`} className="serif text-lead font-bold leading-snug text-ink hover:underline">
                        {t.marketTitle}
                      </Link>
                      <span className="text-small text-muted">
                        {new Date(t.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    <p className="mt-2 text-body text-ink">
                      <span className="font-semibold">{isBuy ? "Bought" : "Sold"}</span>{" "}
                      <span className="num font-semibold">{t.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>{" "}
                      <span className={`font-semibold ${sideColor}`}>{t.outcome}</span> shares for{" "}
                      <span className="num font-semibold">{usd(t.amountUsd)}</span>{" "}
                      <span className="text-muted">
                        (avg <span className="num">${t.avgPrice.toFixed(4)}</span>/share)
                      </span>
                    </p>

                    <p className="mt-1 text-small text-muted">
                      LLM estimate <span className="num text-ink">Yes {pct(t.agentProbability)}</span> vs market{" "}
                      <span className="num text-ink">Yes {pct(t.marketYesPrice)}</span> · edge{" "}
                      <span className="num text-ink">{(t.edge * 100).toFixed(1)} pts</span> · <span className="text-ink">{t.confidence}</span> confidence
                    </p>

                    {t.reasoning && (
                      <details className="mt-2 text-small">
                        <summary className="cursor-pointer text-ink-2 hover:text-ink">LLM reasoning</summary>
                        <p className="serif mt-2 max-w-[75ch] whitespace-pre-line text-body text-ink-2">{t.reasoning}</p>
                      </details>
                    )}

                    <p className="mt-2 text-small text-muted">
                      Agent <span className="num">{shortAddress(t.walletAddress)}</span>
                      {t.model && t.model !== "manual-override" ? <> · {t.model}</> : null}
                      {t.model === "manual-override" ? <> · manual test</> : null}
                      {t.txHash ? (
                        <>
                          {" · "}
                          <a href={`https://sepolia.basescan.org/tx/${t.txHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                            View transaction
                          </a>
                        </>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </PageShell>
    </div>
  );
}
