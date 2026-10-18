"use client";

import React from "react";
import { formatOddsToCents } from "../../utils/formatOdds";

type Props = {
  oddsYes: bigint | undefined;
  oddsNo: bigint | undefined;
  oddsLoading?: boolean;
  onPick: (side: "yes" | "no") => void;
  disabled?: boolean;
};

/** Below lg: the original outcome buttons pinned to the bottom; either opens the trade sheet. */
export default function TradeBar({ oddsYes, oddsNo, oddsLoading, onPick, disabled }: Props) {
  return (
    <div className="trade-bar fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-ground pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
      <div className="container-page grid grid-cols-2 gap-2">
        <button type="button" disabled={disabled} onClick={() => onPick("yes")} className="btn btn-yes btn-lg">
          Yes {oddsLoading ? <span className="skeleton-fill" aria-hidden /> : formatOddsToCents(oddsYes)}
        </button>
        <button type="button" disabled={disabled} onClick={() => onPick("no")} className="btn btn-no btn-lg">
          No {oddsLoading ? <span className="skeleton-fill" aria-hidden /> : formatOddsToCents(oddsNo)}
        </button>
      </div>
    </div>
  );
}
