"use client";

import Navbar from "../../../components/Navbar";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { fetchTrades } from "../../utils/tradeApi";
import { getContractsForMarket, tokenContract } from "../../../constants/contracts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { readContract } from "thirdweb";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { prepareContractCall } from "thirdweb";
import { parseAmountToWei } from "../../utils/parseAmountToWei";
import { readOutcomeOddsForMarket } from "../../utils/portfolioTotals";

// Define Trade interface
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

function PortfolioTradesTable({
  trades,
  getOutcomeColor,
  formatPrice,
}: {
  trades: Trade[];
  getOutcomeColor: (outcome: string) => string;
  formatPrice: (price: number) => number;
}) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 tracking-wider">MARKET</th>
          <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 tracking-wider min-w-[92px]">DATE</th>
          <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 tracking-wider min-w-[70px]">TYPE</th>
          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[100px]">AVG PRICE</th>
          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[100px]">SIZE</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {trades.map((trade) => (
          <tr key={trade.id} className="hover:bg-gray-50 transition">
            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap">
              <div>
                <div className={`font-semibold text-xs md:text-sm ${getOutcomeColor(trade.outcome)}`}>
                  {trade.outcome} {formatPrice(trade.avgPrice)}¢{' '}
                  <span className="text-gray-500 font-normal ml-1 text-[10px] md:text-xs">{trade.shares.toFixed(2)} shares</span>
                </div>
                <div className="text-gray-900 font-medium text-xs md:text-sm leading-tight">{trade.marketTitle}</div>
              </div>
            </td>
            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700 text-xs md:text-sm min-w-[92px]">
              {formatTradeDate(trade.createdAt)}
            </td>
            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700 text-xs md:text-sm min-w-[70px]">
              {(trade.tradeType ?? "BUY").toUpperCase()}
            </td>
            <td className="px-2 md:px-6 py-3 md:py-4 text-center text-gray-900 text-xs md:text-base min-w-[100px]">
              {formatPrice(trade.avgPrice)}¢
            </td>
            <td className="px-2 md:px-6 py-3 md:py-4 text-center text-gray-900 text-xs md:text-base min-w-[100px]">
              ${trade.betAmount.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Interface for current positions
interface CurrentPosition {
  marketId: string;
  marketTitle: string;
  outcome: string;
  shares: number;
  currentPrice: number;
  positionValue: number;
  avgPrice?: number; // We'll need to calculate this from trade history
  betAmount?: number; // We'll need to calculate this from trade history
  toWin?: number; // We'll need to calculate this from trade history
  pnl?: number; // We'll need to calculate this
}

function formatBalance(balance: bigint | undefined): number {
  if (!balance) return 0;
  // Divide by 10^18 and show as a number
  return Number(balance) / 1e18;
}

export default function PortfolioPage() {
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [pnlHistory, setPnlHistory] = useState<{ timestamp: number; pnl: number }[]>([]);
  const { requestCashRefresh } = usePortfolio();
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

      if (type !== "SELL") {
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
      } else {
        // SELL (average-cost): reduce shares, keep avg cost per share
        cur.dbNetShares = Math.max(0, cur.dbNetShares - sh);
        if (cur.dbNetShares === 0) {
          cur.avgCostPerShare = null;
          cur.firstBuyAt = undefined;
        }
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
          const { conditionalTokensContract, outcome1PositionId, outcome2PositionId } = getContractsForMarket(market.id);
          
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

          // Convert to real numbers (divide by 10^18)
          const yesShares = Number(yesBalance) / 1e18;
          const noShares = Number(noBalance) / 1e18;

          const { marketContract } = getContractsForMarket(market.id);
          const odds = await readOutcomeOddsForMarket(marketContract);
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
  const { data: balance, refetch } = useReadContract({
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

  useEffect(() => {
    if (account && balance !== undefined && Number(balance) === 0) {
      const parsedAmount = parseAmountToWei("100");
      const transaction = prepareContractCall({
        contract: tokenContract,
        method: "function mint(address account, uint256 amount)",
        params: [account.address, parsedAmount],
      });
      sendTransaction(transaction, {
        onSuccess: () => {
          refetch();
          requestCashRefresh();
        }
      });
    }
  }, [account, balance, refetch, sendTransaction, requestCashRefresh]);
// }, [account, balance]);

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-white flex flex-col pt-8 w-full">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-6 lg:px-8">
          {/* Portfolio Balance Card */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 mb-8 flex items-start justify-start w-[700px] max-w-full" style={{ height: 176 }}>
            <div>
              <div className="flex items-center mb-2">
                <span className="uppercase tracking-widest text-gray-500 font-semibold text-xs md:text-sm">Portfolio</span>
              </div>
              <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                ${totalPortfolio.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col items-start ml-20">
                              <span className="text-gray-500 font-semibold text-xs md:text-sm uppercase tracking-widest mb-1">Cash</span>
                              <span className="text-gray-900 font-bold text-xs md:text-[14px] mb-4">
                                ${cash.toFixed(2)}
                              </span>
              <span className="text-gray-500 font-semibold text-xs md:text-sm uppercase tracking-widest mb-1 block" style={{ paddingTop: 12 }}>Bet Value</span>
                              <span className="text-gray-900 font-bold text-xs md:text-[14px] mb-4">
                                ${totalPositionsValue.toFixed(2)}
                              </span>
            </div>
            </div>

          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            {/* Tab Buttons */}
            <div className="flex border-b border-gray-200 dark:border-border">
              <button
                onClick={() => setActiveTab('current')}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'current'
                    ? 'bg-gray-200 text-green-700 border-green-600 dark:bg-zinc-800 dark:text-accent-yes dark:border-accent-yes'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-800/60'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'history'
                    ? 'bg-gray-200 text-green-700 border-green-600 dark:bg-zinc-800 dark:text-accent-yes dark:border-accent-yes'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-800/60'
                }`}
              >
                Trade History
              </button>
            </div>

            {/* Tab Content */}
            <div className="overflow-x-auto">
              {activeTab === 'history' &&
                (tradesLoading ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    Loading trade history...
                  </div>
                ) : tradesError ? (
                  <div className="text-center text-red-500 py-12">{tradesError}</div>
                ) : (
                  <>
                    <PortfolioTradesTable
                      trades={trades}
                      getOutcomeColor={getOutcomeColor}
                      formatPrice={formatPrice}
                    />
                    {trades.length === 0 && (
                      <div className="text-center text-gray-500 py-12">
                        No trades yet. Your portfolio will appear here after you make your first trade.
                      </div>
                    )}
                  </>
                ))}

              {activeTab === 'current' && (
                <>
                  {currentPositionsLoading ? (
                    <div className="text-center text-gray-500 py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      Loading open positions...
                    </div>
                  ) : currentPositions.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      No open positions. Trades for markets you still hold on-chain will appear here after you buy through
                      the app.
                    </div>
                  ) : tradesLoading ? (
                    <div className="text-center text-gray-500 py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      Loading saved trade details...
                    </div>
                  ) : tradesError ? (
                    <div className="text-center text-red-500 py-12">{tradesError}</div>
                  ) : openPositions.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      No saved trades match your open positions yet. Positions bought through this app will show entry
                      price, bet, and P/L here.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 tracking-wider">
                            MARKET
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 tracking-wider min-w-[92px]">
                            DATE
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[90px]">
                            <span title="Average Purchase Price">AVG PRICE</span>
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[90px]">
                            NOW
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[80px]">
                            SHARES
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[90px]">
                            BET
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[90px]">
                            VALUE
                          </th>
                          <th className="px-2 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-600 text-center min-w-[90px]">
                            P/L
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {openPositions.map((pos) => {
                          const markValue = pos.shares * pos.currentPrice;
                          const avgPriceCents =
                            pos.avgCostPerShare !== null ? formatPrice(pos.avgCostPerShare) : null;
                          const betBasis =
                            pos.avgCostPerShare !== null ? pos.shares * pos.avgCostPerShare : null;
                          const pl = betBasis !== null ? markValue - betBasis : null;
                          return (
                            <tr key={pos.key} className="hover:bg-gray-50 transition">
                              <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                <div>
                                  <div className={`font-semibold text-xs md:text-sm ${getOutcomeColor(pos.outcomeLabel)}`}>
                                    {pos.outcomeLabel} {avgPriceCents !== null ? `${avgPriceCents}¢` : "—"}{" "}
                                    <span className="text-gray-500 font-normal ml-1 text-[10px] md:text-xs">
                                      {pos.shares.toFixed(2)} shares
                                    </span>
                                  </div>
                                  <div className="text-gray-900 font-medium text-xs md:text-sm leading-tight">
                                    {pos.marketTitle}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700 text-xs md:text-sm min-w-[92px]">
                                {formatTradeDate(pos.openedAt)}
                              </td>
                              <td className="px-2 md:px-6 py-3 md:py-4 text-center text-gray-900 text-xs md:text-base min-w-[90px]">
                                {avgPriceCents !== null ? `${avgPriceCents}¢` : "—"}
                              </td>
                              <td className="px-2 md:px-6 py-3 md:py-4 text-center text-gray-900 text-xs md:text-base min-w-[90px]">
                                {formatPrice(pos.currentPrice)}¢
                              </td>
                              <td className="px-2 md:px-6 py-3 md:py-4 text-center text-gray-900 text-xs md:text-base min-w-[80px]">
                                {pos.shares.toFixed(2)}
                              </td>
                              <td className="px-2 md:px-6 py-3 md:py-4 text-center text-gray-900 text-xs md:text-base min-w-[90px]">
                                {betBasis !== null ? `$${betBasis.toFixed(2)}` : "—"}
                              </td>
                              <td
                                className="px-2 md:px-6 py-3 md:py-4 text-center text-xs md:text-base font-bold min-w-[90px]"
                                style={{
                                  color: betBasis !== null && markValue > betBasis ? '#16a34a' : '#dc2626',
                                }}
                              >
                                ${markValue.toFixed(2)}
                              </td>
                              <td
                                className="px-2 md:px-6 py-3 md:py-4 text-center text-xs md:text-base font-bold min-w-[90px]"
                                style={{
                                  color: pl === null ? '#6b7280' : pl > 0 ? '#16a34a' : pl < 0 ? '#dc2626' : '#6b7280',
                                }}
                              >
                                {pl === null ? "—" : `${pl > 0 ? "+" : pl < 0 ? "-" : ""}$${Math.abs(pl).toFixed(2)}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-8 bg-white"></div>
    </div>
  );
} 