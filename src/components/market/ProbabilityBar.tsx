"use client";

import React from "react";

type Props = {
  /** Rounded percentages as the page computes them; null shows "--". */
  yesPct: number | null;
  noPct: number | null;
  /** Odds are being read: show placeholders in the figures' place. */
  loading?: boolean;
  className?: string;
};

/** Market Odds as one understated line, "Yes: 47%  No: 53%", as on the original. */
export default function ProbabilityBar({ yesPct, noPct, loading = false, className = "" }: Props) {
  const v = (side: "yes" | "no", value: number | null) => (
    <span className={side === "yes" ? "text-yes" : "text-no"}>
      {side === "yes" ? "Yes" : "No"}: {loading ? <span className="skeleton-fill" aria-hidden /> : <>{value === null ? "--" : value}%</>}
    </span>
  );

  return (
    <span data-ui className={`num inline-flex gap-4 font-mono text-[15px] font-semibold ${className}`} aria-busy={loading || undefined}>
      {v("yes", yesPct)}
      {v("no", noPct)}
    </span>
  );
}
