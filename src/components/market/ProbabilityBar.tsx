"use client";

import React from "react";

type Props = {
  /** Rounded percentages as the page computes them; null shows "--". */
  yesPct: number | null;
  noPct: number | null;
  /** Odds are being read: show placeholders in the figures' shape. */
  loading?: boolean;
  /** lg: the two figures stacked large, for the market page's figure block (which carries the "Market Odds" head).
   *  md: one line under its own "Market Odds" label. */
  size?: "lg" | "md";
  className?: string;
};

/** Market Odds: the two prices set as serif figures. */
export default function ProbabilityBar({ yesPct, noPct, loading = false, size = "lg", className = "" }: Props) {
  const lg = size === "lg";
  const figure = lg ? "text-[64px] md:text-[84px]" : "text-[34px]";

  const fig = (side: "yes" | "no", value: number | null) => (
    <div className={lg ? "" : "flex items-baseline gap-2"}>
      <div className="text-small text-muted">{side === "yes" ? "Yes" : "No"}</div>
      {loading ? (
        <span className={`skeleton mt-1 inline-block w-[2.6em] leading-none ${figure}`}>&nbsp;</span>
      ) : (
        <div className={`serif num font-extrabold leading-[0.9] tracking-[-0.03em] ${side === "yes" ? "text-yes" : "text-no"} ${figure}`}>
          {value === null ? "--" : value}%
        </div>
      )}
    </div>
  );

  return (
    <div data-ui className={className} aria-busy={loading || undefined}>
      {!lg && <p className="mb-1 text-small font-semibold text-ink">Market Odds</p>}
      <div className={lg ? "flex flex-row gap-8 md:flex-col md:gap-3" : "flex flex-wrap gap-x-6"}>
        {fig("yes", yesPct)}
        {fig("no", noPct)}
      </div>
    </div>
  );
}
