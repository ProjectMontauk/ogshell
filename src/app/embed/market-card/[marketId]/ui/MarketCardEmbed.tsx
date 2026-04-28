"use client";

import { useEffect, useMemo, useState } from "react";
import { readContract } from "thirdweb";
import { getContractsForMarket } from "../../../../../../constants/contracts";
import { getMarketById } from "@/data/markets";

type OddsHistoryEntry = {
  id: number;
  yesProbability: number;
  noProbability: number;
  timestamp: string;
};

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function formatPct(p: number) {
  return `${Math.round(clamp01(p) * 100)}%`;
}

function formatMultiplier(p: number) {
  const pp = clamp01(p);
  if (pp <= 0) return "—";
  return `${(1 / pp).toFixed(2)}x`;
}

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

function SparkLines({
  data,
  className,
}: {
  data: { yes: number; no: number }[];
  className?: string;
}) {
  const w = 360;
  const h = 80;
  const padX = 2;
  const padY = 6;

  const points = useMemo(() => {
    const safe = data.length ? data : [{ yes: 0.5, no: 0.5 }];
    const yes = safe.map((d) => clamp01(d.yes));
    const no = safe.map((d) => clamp01(d.no));
    const n = safe.length;

    const toXY = (v: number, i: number) => {
      const x = padX + (n === 1 ? 0 : (i / (n - 1)) * (w - padX * 2));
      const y = padY + (1 - v) * (h - padY * 2);
      return { x, y };
    };

    const pathFor = (arr: number[]) =>
      arr
        .map((v, i) => {
          const { x, y } = toXY(v, i);
          return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");

    return {
      yesPath: pathFor(yes),
      noPath: pathFor(no),
    };
  }, [data]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Odds history chart"
      preserveAspectRatio="none"
    >
      <g
        className="stroke-black/10 dark:stroke-white/10"
        strokeWidth="1"
        strokeDasharray="4 6"
      >
        <line x1="0" y1={h * 0.25} x2={w} y2={h * 0.25} />
        <line x1="0" y1={h * 0.5} x2={w} y2={h * 0.5} />
        <line x1="0" y1={h * 0.75} x2={w} y2={h * 0.75} />
      </g>

      <path
        d={points.yesPath}
        className="stroke-emerald-500 dark:stroke-[#00e889]"
        strokeWidth="2"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={points.noPath}
        className="stroke-sky-500 dark:stroke-[#3b82f6]"
        strokeWidth="2"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function MarketCardEmbed({
  marketId,
  apiBase,
}: {
  marketId: string;
  apiBase?: string;
}) {
  const market = getMarketById(marketId);
  const [history, setHistory] = useState<OddsHistoryEntry[] | null>(null);
  const [live, setLive] = useState<{ yes: number; no: number } | null>(null);

  const apiOrigin = useMemo(() => normalizeApiBase(apiBase), [apiBase]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const localUrl = `/api/odds-history?marketId=${encodeURIComponent(marketId)}`;
        const res = await fetch(localUrl, { method: "GET" });
        if (!res.ok) throw new Error(`odds-history ${res.status}`);
        const data = (await res.json()) as OddsHistoryEntry[];
        const localRows = Array.isArray(data) ? data : [];

        if (cancelled) return;
        if (localRows.length > 0) {
          setHistory(localRows);
          return;
        }

        if (apiOrigin) {
          const remoteUrl = `${apiOrigin}/api/odds-history?marketId=${encodeURIComponent(marketId)}`;
          const res2 = await fetch(remoteUrl, { method: "GET" });
          if (!res2.ok) throw new Error(`odds-history(remote) ${res2.status}`);
          const data2 = (await res2.json()) as OddsHistoryEntry[];
          if (cancelled) return;
          setHistory(Array.isArray(data2) ? data2 : []);
          return;
        }

        setHistory([]);
      } catch {
        if (cancelled) return;
        setHistory([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [apiOrigin, marketId]);

  useEffect(() => {
    if (history === null) return;
    if (history.length > 0) return;

    let cancelled = false;
    const run = async () => {
      try {
        const { marketContract } = getContractsForMarket(marketId);
        const INVESTMENT_AMOUNT = BigInt("1000000000000000000");
        const [sharesYes, sharesNo] = await Promise.all([
          readContract({
            contract: marketContract,
            method:
              "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
            params: [INVESTMENT_AMOUNT, 0n],
          }),
          readContract({
            contract: marketContract,
            method:
              "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
            params: [INVESTMENT_AMOUNT, 1n],
          }),
        ]);
        const inv = Number(INVESTMENT_AMOUNT);
        const sY = Number(sharesYes);
        const sN = Number(sharesNo);
        if (cancelled) return;
        if (sY <= 0 || sN <= 0) return;
        const oddsYesRaw = inv / sY;
        const oddsNoRaw = inv / sN;
        const probYes = oddsYesRaw / (oddsYesRaw + oddsNoRaw);
        const probNo = oddsNoRaw / (oddsYesRaw + oddsNoRaw);
        setLive({ yes: probYes, no: probNo });
      } catch {
        if (cancelled) return;
        setLive(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [history, marketId]);

  const latest = useMemo(() => {
    const last = history && history.length ? history[history.length - 1] : null;
    if (last) {
      const yes = clamp01(last.yesProbability);
      const no = clamp01(last.noProbability);
      const sum = yes + no;
      return sum > 0 ? { yes: yes / sum, no: no / sum } : { yes: 0.5, no: 0.5 };
    }
    if (live) {
      const yes = clamp01(live.yes);
      const no = clamp01(live.no);
      const sum = yes + no;
      return sum > 0 ? { yes: yes / sum, no: no / sum } : { yes: 0.5, no: 0.5 };
    }
    return { yes: 0.5, no: 0.5 };
  }, [history, live]);

  const chartData = useMemo(() => {
    const arr = (history ?? []).slice(-60);
    if (!arr.length) {
      const p = latest;
      return [
        { yes: 0.5, no: 0.5 },
        { yes: p.yes, no: p.no },
        { yes: p.yes, no: p.no },
      ];
    }
    if (arr.length === 1) {
      const e = arr[0];
      const yes = clamp01(e.yesProbability);
      const no = clamp01(e.noProbability);
      const sum = yes + no;
      const p = sum > 0 ? { yes: yes / sum, no: no / sum } : { yes: 0.5, no: 0.5 };
      return [{ yes: 0.5, no: 0.5 }, p, p];
    }
    return arr.map((e) => {
      const yes = clamp01(e.yesProbability);
      const no = clamp01(e.noProbability);
      const sum = yes + no;
      return sum > 0 ? { yes: yes / sum, no: no / sum } : { yes: 0.5, no: 0.5 };
    });
  }, [history, latest]);

  if (!market) return null;

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-black/10 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0f121a]">
        <div className="p-5">
          <div className="text-[18px] font-semibold leading-snug text-zinc-900 dark:text-white">
            {market.title}
          </div>
          <div className="mt-1 text-[12px] leading-snug text-zinc-600 dark:text-zinc-300">
            {market.description}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-[3px] w-5 shrink-0 rounded-full bg-emerald-500 dark:bg-[#00e889]" />
              <div className="text-[12px] font-medium text-zinc-800 dark:text-zinc-100">Yes</div>
              <div className="ml-auto text-[12px] text-zinc-500 dark:text-zinc-400">
                {formatMultiplier(latest.yes)}
              </div>
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[12px] font-semibold text-emerald-700 dark:border-[#00e889]/40 dark:bg-[#00e889]/10 dark:text-[#00e889]">
                {formatPct(latest.yes)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-[3px] w-5 shrink-0 rounded-full bg-sky-500 dark:bg-[#3b82f6]" />
              <div className="text-[12px] font-medium text-zinc-800 dark:text-zinc-100">No</div>
              <div className="ml-auto text-[12px] text-zinc-500 dark:text-zinc-400">
                {formatMultiplier(latest.no)}
              </div>
              <div className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[12px] font-semibold text-sky-700 dark:border-[#3b82f6]/40 dark:bg-[#3b82f6]/10 dark:text-[#3b82f6]">
                {formatPct(latest.no)}
              </div>
            </div>
          </div>

          <div className="mt-4 h-[84px] w-full">
            <SparkLines data={chartData} className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
