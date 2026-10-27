"use client";

import Navbar from "../../../components/Navbar";
import Link from "next/link";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { fetchTrades } from "../../utils/tradeApi";
import { getContractsForMarket, tokenContract } from "../../../constants/contracts";
import { CASH_TOKEN_SCALE } from "../../../constants/tokenUnits";
import { bigintWeiToHumanNumber } from "../../utils/fixedPointAmount";
import { useState, useEffect, useCallback, useMemo } from "react";
import { readContract } from "thirdweb";
import { readOutcomeOddsForMarket } from "../../utils/portfolioTotals";
import { Skeleton } from "../../components/ui/Skeleton";

interface Trade {
  id: number;
  walletAddress: string;
  marketTitle: string;
  marketId: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  betAmount: number;
  toWin: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  txHash?: string | null;
  tradeType?: string;
}

type OutcomeKind = "yes" | "no" | "other";
function outcomeKind(label: string | undefined): OutcomeKind {
  const s = (label ?? "").trim().toLowerCase();
  if (!s) return "other";
  if (s === "yes" || s.includes(" yes") || s.startsWith("yes") || s.includes("yes")) return "yes";
  if (s === "no" || s.includes(" no") || s.startsWith("no") || s.includes("no")) return "no";
  return "other";
}

function isActiveOpenStatus(status: string | undefined): boolean {
  if (!status) return true;
  const u = status.toUpperCase();
  return !["WON", "LOST", "CLOSED", "SETTLED", "SOLD"].includes(u);
}

function formatTradeDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function sideClass(label: string) {
  const k = outcomeKind(label);
  return k === "yes" ? "text-yes" : k === "no" ? "text-no" : "text-ink";
}

function formatCents(price: number) {
  return `${Math.round(price * 100)}¢`;
}

const th = "px-3 py-2.5 text-left text-small font-medium text-muted first:pl-0 last:pr-0";
// Rows sit on dotted rules and take a tint on hover, as in the broadsheet tables.
const td = "border-b border-dotted border-rule px-3 py-3.5 align-top text-small first:pl-0 last:pr-0";

function TradesTable({ trades }: { trades: Trade[] }) {
  return (
    <table className="w-full min-w-[640px] border-collapse">
      <thead>
        <tr className="border-b border-ink">
          <th className={th}>MARKET</th>
          <th className={th}>DATE</th>
          <th className={th}>TYPE</th>
          <th className={`${th} text-right`}>AVG PRICE</th>
          <th className={`${th} text-right`}>SIZE</th>
        </tr>
      </thead>
      <tbody className="[&>tr]:transition-colors [&>tr:hover]:bg-ground-2">
        {trades.map((trade) => {
          const redemption = (trade.tradeType ?? "").toLowerCase() === "redemption";
          return (
            <tr key={trade.id}>
              <td className={td}>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-small font-medium ${sideClass(trade.outcome)}`}>
                    {trade.outcome} {redemption ? "$1.00" : formatCents(trade.avgPrice)}
                    <span className="num ml-2 font-normal text-muted">{trade.shares.toFixed(2)} shares</span>
                  </span>
                  <span className="serif text-body font-bold text-ink">{trade.marketTitle}</span>
                </div>
              </td>
              <td className={`${td} whitespace-nowrap text-ink-2`}>{formatTradeDate(trade.createdAt)}</td>
              <td className={`${td} text-ink-2`}>{redemption ? "Redemption" : (trade.tradeType ?? "BUY").toUpperCase()}</td>
              <td className={`${td} num text-right text-ink`}>{redemption ? "$1.00" : formatCents(trade.avgPrice)}</td>
              <td className={`${td} num text-right text-ink`}>${Number(trade.betAmount).toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface CurrentPosition {
  marketId: string;
  marketTitle: string;
  outcome: string;
  shares: number;
  currentPrice: number;
  positionValue: number;
}

function formatBalance(balance: bigint | undefined): number {
  if (!balance) return 0;
  return Number(balance) / CASH_TOKEN_SCALE;
}

function Figure({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 py-4 sm:px-6 sm:first:pl-0 sm:[&+&]:border-l sm:[&+&]:border-rule">
      <span className="text-small text-muted">{label}</span>
      <span className={`serif num text-[clamp(36px,5.4vw,64px)] font-bold leading-none tracking-[-0.03em] ${muted ? "text-ink-2" : "text-ink"}`}>{value}</span>
    </div>
  );
}

export default function PortfolioPage() {
  const account = useActiveAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [pnlHistory, setPnlHistory] = useState<{ timestamp: number; pnl: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'current'>('current');
  const [currentPositions, setCurrentPositions] = useState<CurrentPosition[]>([]);
  const [currentPositionsLoading, setCurrentPositionsLoading] = useState(false);

  const tradeAggByKey = useMemo(() => {
    // Average-cost aggregator per (marketId, outcomeKind)
    const sorted = [...trades].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
    });

    type Agg = {
      marketId: string;
      kind: OutcomeKind;
      avgCostPerShare: number | null; // dollars per share
      dbNetShares: number; // buys - sells
      firstBuyAt?: string;
      lastTradeAt?: string;
      anyClosed: boolean;
    };

    const map = new Map<string, Agg>();
    for (const t of sorted) {
      const kind = outcomeKind(t.outcome);
      if (kind === "other") continue;
      const key = `${t.marketId}::${kind}`;
      const cur: Agg =
        map.get(key) ?? {
          marketId: t.marketId,
          kind,
          avgCostPerShare: null,
          dbNetShares: 0,
          firstBuyAt: undefined,
          lastTradeAt: undefined,
          anyClosed: false,
        };

      const type = (t.tradeType ?? "BUY").toUpperCase();
      const sh = Number(t.shares);
      const bet = Number(t.betAmount);
      if (!Number.isFinite(sh) || sh <= 0) continue;

      cur.lastTradeAt = t.createdAt || cur.lastTradeAt;
      if (!isActiveOpenStatus(t.status)) cur.anyClosed = true;

      if (type === "SELL" || type === "REDEMPTION") {
        // SELL / redemption: reduce shares, keep avg cost per share
        cur.dbNetShares = Math.max(0, cur.dbNetShares - sh);
        if (cur.dbNetShares === 0) {
          cur.avgCostPerShare = null;
          cur.firstBuyAt = undefined;
        }
      } else {
        // BUY
        const buyCostPerShare = Number.isFinite(bet) && bet >= 0 ? bet / sh : 0;
        const prevShares = cur.dbNetShares;
        const prevAvg = cur.avgCostPerShare ?? 0;
        const prevCost = prevShares > 0 ? prevShares * prevAvg : 0;
        const newShares = prevShares + sh;
        const newCost = prevCost + buyCostPerShare * sh;
        cur.dbNetShares = newShares;
        cur.avgCostPerShare = newShares > 0 ? newCost / newShares : null;
        if (!cur.firstBuyAt) cur.firstBuyAt = t.createdAt;
      }

      map.set(key, cur);
    }
    return map;
  }, [trades]);

  // Fetch current positions across all markets
  const fetchCurrentPositions = useCallback(async () => {
    if (!account?.address) {
      setCurrentPositions([]);
      return;
    }

    setCurrentPositionsLoading(true);
    try {
      const positions: CurrentPosition[] = [];
      const { getAllMarkets } = await import('../../data/markets');
      const markets = getAllMarkets();

      for (const market of markets) {
        try {
          const { conditionalTokensContract, outcome1PositionId, outcome2PositionId, marketContract, outcomeTokenDecimals } =
            getContractsForMarket(market.id);
          
          // Fetch Yes shares balance
          const yesBalance = await readContract({
            contract: conditionalTokensContract,
            method: "function balanceOf(address account, uint256 id) view returns (uint256)",
            params: [
              account.address as `0x${string}`,
              BigInt(outcome1PositionId)
            ],
          });

          // Fetch No shares balance
          const noBalance = await readContract({
            contract: conditionalTokensContract,
            method: "function balanceOf(address account, uint256 id) view returns (uint256)",
            params: [
              account.address as `0x${string}`,
              BigInt(outcome2PositionId)
            ],
          });

          // Convert to human share amounts (per-market fixed-point decimals, e.g. 6 or 18)
          const yesShares = bigintWeiToHumanNumber(
            typeof yesBalance === "bigint" ? yesBalance : BigInt(String(yesBalance)),
            outcomeTokenDecimals
          );
          const noShares = bigintWeiToHumanNumber(
            typeof noBalance === "bigint" ? noBalance : BigInt(String(noBalance)),
            outcomeTokenDecimals
          );

          const odds = await readOutcomeOddsForMarket(marketContract, outcomeTokenDecimals);
          if (!odds) {
            throw new Error("Could not read market odds (FPMM or LMSR)");
          }
          const currentPriceYes = Number(odds.oddsYes) / Math.pow(2, 64);
          const currentPriceNo = Number(odds.oddsNo) / Math.pow(2, 64);

          // Add Yes position if user has shares >= 0.01
          if (yesShares >= 0.01) {
            positions.push({
              marketId: market.id,
              marketTitle: market.title,
              outcome: market.outcomes[0], // Yes outcome
              shares: yesShares,
              currentPrice: currentPriceYes,
              positionValue: yesShares * currentPriceYes,
            });
          }

          // Add No position if user has shares >= 0.01
          if (noShares >= 0.01) {
            positions.push({
              marketId: market.id,
              marketTitle: market.title,
              outcome: market.outcomes[1], // No outcome
              shares: noShares,
              currentPrice: currentPriceNo,
              positionValue: noShares * currentPriceNo,
            });
          }
        } catch (error) {
          const detail =
            error instanceof Error
              ? error.message
              : error && typeof error === "object" && "message" in error
                ? String((error as { message: unknown }).message)
                : String(error);
          console.error(`Failed to fetch positions for market ${market.id}:`, detail || error);
        }
      }

      setCurrentPositions(positions);
    } catch (error) {
      console.error('Failed to fetch current positions:', error);
    } finally {
      setCurrentPositionsLoading(false);
    }
  }, [account?.address]);

  // Fetch user's cash balance from contract (same as Navbar)
  const { data: balance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [account?.address ?? "0x0000000000000000000000000000000000000000"],
  });

  const cash = formatBalance(balance);

  // Fetch trades when account changes
  useEffect(() => {
    const loadTrades = async () => {
      if (!account?.address) {
        setTrades([]);
        setTradesLoading(false);
        return;
      }

      try {
        setTradesLoading(true);
        setTradesError(null);
        const tradeData = await fetchTrades(account.address);
        setTrades(tradeData);
      } catch (err) {
        console.error('Failed to fetch trades:', err);
        setTradesError('Failed to load portfolio data');
      } finally {
        setTradesLoading(false);
      }
    };

    loadTrades();
  }, [account?.address]);

  /** Saved trades that still match an on-chain position (not sold / not settled in DB). */
  type OpenPositionRow = {
    key: string;
    marketId: string;
    marketTitle: string;
    kind: OutcomeKind;
    outcomeLabel: string;
    shares: number;
    avgCostPerShare: number | null; // dollars per share
    openedAt?: string;
    currentPrice: number; // dollars per share
  };

  const openPositions = useMemo<OpenPositionRow[]>(() => {
    const rows: OpenPositionRow[] = [];
    for (const p of currentPositions) {
      const kind = outcomeKind(p.outcome);
      if (kind === "other") continue;
      const key = `${p.marketId}::${kind}`;
      const agg = tradeAggByKey.get(key);

      // Only show positions that are still open on-chain (authoritative).
      if (!Number.isFinite(p.shares) || p.shares < 0.01) continue;

      // Gate on active status only if we have recorded trades; otherwise show with unknown cost basis.
      if (agg?.anyClosed) continue;

      rows.push({
        key,
        marketId: p.marketId,
        marketTitle: p.marketTitle,
        kind,
        outcomeLabel: kind === "yes" ? "Yes" : "No",
        shares: p.shares,
        avgCostPerShare: agg?.avgCostPerShare ?? null,
        // Date policy: show when the position was opened (first recorded buy).
        openedAt: agg?.firstBuyAt ?? agg?.lastTradeAt,
        currentPrice: p.currentPrice,
      });
    }
    // Stable ordering: newest opened first, then marketId/outcome
    return rows.sort((a, b) => {
      const ta = a.openedAt ? new Date(a.openedAt).getTime() : 0;
      const tb = b.openedAt ? new Date(b.openedAt).getTime() : 0;
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta) || a.marketId.localeCompare(b.marketId) || a.kind.localeCompare(b.kind);
    });
  }, [currentPositions, tradeAggByKey]);

  // Fetch current positions when account changes or when Current tab is selected
  useEffect(() => {
    if (activeTab === 'current') {
      fetchCurrentPositions();
    }
  }, [account?.address, activeTab, fetchCurrentPositions]);


  // Add PnL history update on page visit
  useEffect(() => {
    const updatePnLHistory = async () => {
      if (!account?.address) return;
      try {
        await fetch('/api/pnl-history-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: account.address }),
        });
      } catch (e) {
        console.log(e);
        // Optionally log or ignore
        // console.error('Failed to update PnL history:', e);
      }
    };
    updatePnLHistory();
  }, [account?.address]);

  // Fetch PnL history for chart
  useEffect(() => {
    const fetchPnlHistory = async () => {
      if (!account?.address) {
        setPnlHistory([]);
        return;
      }
      try {
        const res = await fetch(`/api/pnl-history?walletAddress=${account.address}`);
        const data = await res.json();
        // Convert timestamp to ms since epoch for recharts
        const formatted = Array.isArray(data)
          ? data.reverse().map(entry => ({ ...entry, timestamp: new Date(entry.timestamp).getTime() }))
          : [];
        setPnlHistory(formatted);
      } catch (e) {
        console.log('Failed to fetch PnL history:', e);
        setPnlHistory([]);
      } finally {
        //setLoadingPnl(false);
      }
    };
    fetchPnlHistory();
  }, [account?.address]);

  // Before rendering, print the data being plotted
  console.log('PnL History data for chart:', pnlHistory);

  // Helper function to get outcome color
  const getOutcomeColor = (outcome: string) => {
    if (outcome.toLowerCase().includes('yes')) return 'text-green-600';
    if (outcome.toLowerCase().includes('no')) return 'text-red-600';
    return 'text-blue-600';
  };

  // Helper function to format price in cents
  const formatPrice = (price: number) => {
    return Math.round(price * 100); // Convert to cents
  };

  // Calculate total portfolio value using current positions
  const totalPositionsValue = currentPositions.reduce((sum, position) => sum + position.positionValue, 0);
  const totalPortfolio = cash + totalPositionsValue;


  const rowsSkeleton = (
    <div className="flex flex-col gap-3 py-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-4 w-14" />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="container-page pb-24 pt-10 md:pt-14">
        <header className="rule-bleed">
          <div className="grid grid-cols-1 divide-y divide-rule sm:grid-cols-3 sm:divide-y-0">
            <Figure label="Portfolio" value={`$${totalPortfolio.toFixed(2)}`} />
            <Figure label="Cash" value={`$${cash.toFixed(2)}`} muted />
            <Figure label="Bet Value" value={`$${totalPositionsValue.toFixed(2)}`} muted />
          </div>
        </header>

          <section className="mt-8">
            <div role="tablist" aria-label="Portfolio" className="tabs rule-bleed-b">
              <button role="tab" type="button" aria-selected={activeTab === "current"} onClick={() => setActiveTab("current")} className="tab">
                Open
              </button>
              <button role="tab" type="button" aria-selected={activeTab === "history"} onClick={() => setActiveTab("history")} className="tab">
                Trade History
              </button>
            </div>

            <div className="mt-2 overflow-x-auto">
              {activeTab === "history" &&
                (tradesLoading ? (
                  rowsSkeleton
                ) : tradesError ? (
                  <p className="py-6 text-small text-danger">{tradesError}</p>
                ) : trades.length === 0 ? (
                  <p className="py-6 text-small text-muted">No trades yet. Your portfolio will appear here after you make your first trade.</p>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <TradesTable trades={trades} />
                    </div>
                    <ol className="row-list md:hidden">
                      {trades.map((trade) => {
                        const redemption = (trade.tradeType ?? "").toLowerCase() === "redemption";
                        return (
                          <li key={trade.id} className="flex flex-col gap-1 border-b border-dotted border-rule py-3.5">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className={`text-small font-medium ${sideClass(trade.outcome)}`}>
                                {trade.outcome} {redemption ? "$1.00" : formatCents(trade.avgPrice)}
                                <span className="num ml-2 font-normal text-muted">{trade.shares.toFixed(2)} shares</span>
                              </span>
                              <span className="num text-small font-medium text-ink">${Number(trade.betAmount).toFixed(2)}</span>
                            </div>
                            <span className="serif text-body font-bold text-ink">{trade.marketTitle}</span>
                            <span className="num text-small text-muted">
                              {formatTradeDate(trade.createdAt)} <span className="ml-2">{redemption ? "Redemption" : (trade.tradeType ?? "BUY").toUpperCase()}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                ))}

              {activeTab === "current" &&
                (currentPositionsLoading ? (
                  rowsSkeleton
                ) : currentPositions.length === 0 ? (
                  <p className="py-6 text-small text-muted">
                    No open positions. Trades for markets you still hold on-chain will appear here after you buy through
                    the app.
                  </p>
                ) : tradesLoading ? (
                  rowsSkeleton
                ) : tradesError ? (
                  <p className="py-6 text-small text-danger">{tradesError}</p>
                ) : openPositions.length === 0 ? (
                  <p className="py-6 text-small text-muted">
                    No saved trades match your open positions yet. Positions bought through this app will show entry
                    price, bet, and P/L here.
                  </p>
                ) : (
                  <>
                  <ol className="row-list md:hidden">
                    {openPositions.map((pos) => {
                      const markValue = pos.shares * pos.currentPrice;
                      const betBasis = pos.avgCostPerShare !== null ? pos.shares * pos.avgCostPerShare : null;
                      const pl = betBasis !== null ? markValue - betBasis : null;
                      const plClass = pl === null ? "text-muted" : pl > 0 ? "text-yes" : pl < 0 ? "text-danger" : "text-muted";
                      return (
                        <li key={pos.key} className="flex flex-col gap-1.5 border-b border-dotted border-rule py-3.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className={`text-small font-medium ${pos.kind === "yes" ? "text-yes" : "text-no"}`}>{pos.outcomeLabel}</span>
                            <span className={`num text-small font-medium ${plClass}`}>{pl === null ? "—" : `${pl > 0 ? "+" : pl < 0 ? "-" : ""}$${Math.abs(pl).toFixed(2)}`}</span>
                          </div>
                          <Link href={`/markets/${pos.marketId}`} className="serif text-body font-bold text-ink">
                            {pos.marketTitle}
                          </Link>
                          <div className="num flex flex-wrap gap-x-4 gap-y-0.5 text-small text-muted">
                            <span>{pos.shares.toFixed(2)} shares</span>
                            <span>AVG PRICE {pos.avgCostPerShare !== null ? formatCents(pos.avgCostPerShare) : "—"}</span>
                            <span>NOW {formatCents(pos.currentPrice)}</span>
                            <span className="text-ink">VALUE ${markValue.toFixed(2)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <table className="hidden w-full min-w-[720px] border-collapse md:table">
                    <thead>
                      <tr className="border-b border-ink">
                        <th className={th}>MARKET</th>
                        <th className={th}>DATE</th>
                        <th className={`${th} text-right`}><span title="Average Purchase Price">AVG PRICE</span></th>
                        <th className={`${th} text-right`}>NOW</th>
                        <th className={`${th} text-right`}>SHARES</th>
                        <th className={`${th} text-right`}>BET</th>
                        <th className={`${th} text-right`}>VALUE</th>
                        <th className={`${th} text-right`}>P/L</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr]:transition-colors [&>tr:hover]:bg-ground-2">
                      {openPositions.map((pos) => {
                        const markValue = pos.shares * pos.currentPrice;
                        const betBasis = pos.avgCostPerShare !== null ? pos.shares * pos.avgCostPerShare : null;
                        const pl = betBasis !== null ? markValue - betBasis : null;
                        const plClass = pl === null ? "text-muted" : pl > 0 ? "text-yes" : pl < 0 ? "text-danger" : "text-muted";
                        return (
                          <tr key={pos.key}>
                            <td className={td}>
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-small font-medium ${pos.kind === "yes" ? "text-yes" : "text-no"}`}>{pos.outcomeLabel}</span>
                                <Link href={`/markets/${pos.marketId}`} className="serif text-body font-bold text-ink underline-offset-[3px] hover:underline hover:decoration-hairline-2">
                                  {pos.marketTitle}
                                </Link>
                              </div>
                            </td>
                            <td className={`${td} whitespace-nowrap text-ink-2`}>{formatTradeDate(pos.openedAt)}</td>
                            <td className={`${td} num text-right text-ink-2`}>{pos.avgCostPerShare !== null ? formatCents(pos.avgCostPerShare) : "—"}</td>
                            <td className={`${td} num text-right text-ink`}>{formatCents(pos.currentPrice)}</td>
                            <td className={`${td} num text-right text-ink-2`}>{pos.shares.toFixed(2)}</td>
                            <td className={`${td} num text-right text-ink-2`}>{betBasis !== null ? `$${betBasis.toFixed(2)}` : "—"}</td>
                            <td className={`${td} num text-right font-medium text-ink`}>${markValue.toFixed(2)}</td>
                            <td className={`${td} num text-right font-medium ${plClass}`}>
                              {pl === null ? "—" : `${pl > 0 ? "+" : pl < 0 ? "-" : ""}$${Math.abs(pl).toFixed(2)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </>
                ))}
            </div>
          </section>
      </div>
    </div>
  );
}
