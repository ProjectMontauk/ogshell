"use client";

import React from "react";
import { Check } from "@phosphor-icons/react";
import ConditionalTokensRedeemShares, {
  type ConditionalTokensContractInstance,
} from "../ConditionalTokensRedeemShares";
import type { MarketRedeemDefaults } from "../../constants/marketRedeemDefaults";
import { formatOddsToCents } from "../../utils/formatOdds";

export type TradeMode = "buy" | "sell";
export type Outcome = "yes" | "no";

export type PostTradeQuoteSnapshot = {
  mode: TradeMode;
  outcome: Outcome;
  maxWinDisplay: string | null;
  receiveDisplay: string | null;
  avgPriceDisplay: string;
  sellSharesDisplay: string | null;
};

export type TradePanelProps = {
  showTradingUi: boolean;
  oddsLoading?: boolean;
  devTradingBanner: boolean;

  mode: TradeMode;
  onModeChange: (mode: TradeMode) => void;
  selectedOutcome: Outcome | null;
  onSelectOutcome: (o: Outcome) => void;
  amount: string;
  onAmountChange: (v: string) => void;

  oddsYes: bigint | undefined;
  oddsNo: bigint | undefined;

  /** Pre-formatted by the page exactly as on the original (Cash line and share cells). */
  cashText: string;
  yesSharesText: string;
  noSharesText: string;
  /** Per-outcome send status that drives "Buying..." / "Selling..." on the outcome buttons. */
  yesPending: boolean;
  noPending: boolean;

  buyEstShares: string | null;
  buyEstLoading: boolean;
  sellEstShares: string | null;
  sellEstLoading: boolean;
  payoutDisplay: string;
  avgPriceDisplay: string;

  successMessage: string | null;
  snapshot: PostTradeQuoteSnapshot | null;
  /** When the quote lines and Submit Trade are shown (the page's own condition). */
  showAction: boolean;
  tradeInProgress: boolean;
  tradePending: boolean;
  submitDisabled: boolean;

  onSubmit: () => void;
  onSellAll: () => void;

  redeem: {
    conditionalTokensContract: ConditionalTokensContractInstance;
    defaults: MarketRedeemDefaults | null;
    onStart: () => void | Promise<void>;
    onSuccess: (result?: unknown) => void | Promise<void>;
    successMessage: string | null;
  };
};

/** A ledger line: label on the left, figure on the right, a hairline underneath. */
function Row({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink/15 py-2 text-small">
      <span className="text-ink-2">{label}</span>
      <span className={`num ${strong ? "font-semibold text-ink" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function Positions({ yes, no }: { yes: string; no: string }) {
  return (
    <div>
      <Row label="Yes Shares" value={yes} strong />
      <Row label="No Shares" value={no} strong />
    </div>
  );
}

/** Outcome label and price on one ruled line: "Yes … 47¢". */
function OutcomeText({ side, text, loading, odds }: { side: string; text: string | null; loading: boolean; odds: bigint | undefined }) {
  if (text) return <span>{text}</span>;
  return (
    <>
      <span>{side}</span>
      <span className="num">{loading ? <span className="skeleton-fill" aria-hidden /> : formatOddsToCents(odds)}</span>
    </>
  );
}

export default function TradePanel(p: TradePanelProps) {
  const isBuy = p.mode === "buy";
  const showAction = p.showAction;

  if (!p.showTradingUi) {
    return (
      <div className="flex flex-col gap-4">
        {p.redeem.successMessage && (
          <p className="rounded-control bg-yes-soft px-3 py-2 text-small text-ink">{p.redeem.successMessage}</p>
        )}
        <ConditionalTokensRedeemShares
          conditionalTokensContract={p.redeem.conditionalTokensContract}
          defaultCollateralToken={p.redeem.defaults?.collateralToken ?? ""}
          defaultParentCollectionId={
            p.redeem.defaults?.parentCollectionId ?? "0x0000000000000000000000000000000000000000000000000000000000000000"
          }
          defaultConditionId={p.redeem.defaults?.conditionId ?? ""}
          defaultIndexSets={p.redeem.defaults?.defaultIndexSets ?? "1"}
          hideParameterFields={!!p.redeem.defaults}
          onRedeemStart={p.redeem.onStart}
          onRedeemSuccess={p.redeem.onSuccess}
        />
        <div>
          <h3 className="kicker mb-1 font-mono">Your positions</h3>
          <Positions yes={p.yesSharesText} no={p.noSharesText} />
          <p className="mt-2 text-small text-muted">
            After a successful redeem, Yes/No shares drop and matching collateral appears in your wallet cash
            balance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {p.devTradingBanner && (
        <p className="border border-dashed border-rule-2 px-3 py-1.5 text-small text-muted">
          Dev: <code className="num">?fpmmDevTrading=1</code> — buy/sell UI visible for internal testing.
        </p>
      )}

      {/* Buy / Sell, a boxed pair; the balance sits on the right of the line above */}
      <div className="flex flex-col gap-2.5">
        <span className="num self-end text-small text-muted">
          {isBuy ? (
            <>Cash: {p.cashText}</>
          ) : (
            <>
              Yes Shares: {p.yesSharesText}
              <span className="ml-3">No Shares: {p.noSharesText}</span>
            </>
          )}
        </span>
        <div role="tablist" aria-label="Order type" className="seg flex w-full">
          {(["buy", "sell"] as TradeMode[]).map((m) => (
            <button key={m} role="tab" type="button" aria-selected={p.mode === m} onClick={() => p.onModeChange(m)} className="seg-item">
              {m === "buy" ? "Buy" : "Sell"}
            </button>
          ))}
        </div>
      </div>

      {/* Outcome: both filled until one is picked; then the pick keeps its fill and a hard shadow, the other outlines */}
      <div className="flex flex-col gap-2.5">
        {(["yes", "no"] as Outcome[]).map((o) => (
          <button
            key={o}
            type="button"
            className={`btn ${o === "yes" ? "btn-yes" : "btn-no"} h-12 w-full justify-between px-4`}
            data-selected={p.selectedOutcome ? p.selectedOutcome === o : undefined}
            onClick={() => p.onSelectOutcome(o)}
          >
            <OutcomeText
              side={o === "yes" ? "Yes" : "No"}
              text={(o === "yes" ? p.yesPending : p.noPending) ? (isBuy ? "Buying..." : "Selling...") : null}
              loading={!!p.oddsLoading}
              odds={o === "yes" ? p.oddsYes : p.oddsNo}
            />
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="trade-amount" className="text-small text-muted">
            {isBuy ? "Bet Amount" : "Sell Amount"}
          </label>
          {!isBuy && p.selectedOutcome && (
            <button type="button" onClick={p.onSellAll} className="text-small text-muted underline-offset-2 hover:text-ink hover:underline">
              Sell All
            </button>
          )}
        </div>
        <div className="relative">
          <input
            id="trade-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="$"
            value={p.amount ? `$${p.amount}` : ""}
            onChange={(e) => p.onAmountChange(e.target.value.replace(/^\$/, "").replace(/[^0-9.]/g, ""))}
            className="field num border-ink text-[24px] font-bold"
          />
        </div>
      </div>

      {/* Quote */}
      {showAction && (
        <div className="flex flex-col">
          {p.successMessage && p.snapshot ? (
            <>
              {p.snapshot.mode === "buy" && <Row label="Max. Win:" value={`$ ${p.snapshot.maxWinDisplay ?? "--"}`} strong />}
              {p.snapshot.mode === "sell" && <Row label="Receive" value={`$ ${p.snapshot.receiveDisplay ?? "--"}`} strong />}
              <Row label="Avg. Price" value={p.snapshot.avgPriceDisplay !== "--" ? p.snapshot.avgPriceDisplay : ""} />
              {p.snapshot.mode === "sell" && (
                <Row label={`${p.snapshot.outcome === "yes" ? "Yes" : "No"} Shares to sell:`} value={p.snapshot.sellSharesDisplay ?? "--"} />
              )}
            </>
          ) : (
            !p.successMessage && (
              <>
                {isBuy ? (
                  <Row label="Max. Win:" value={`$ ${p.buyEstLoading ? "..." : p.buyEstShares ?? "--"}`} strong />
                ) : (
                  <Row label="Receive" value={`$ ${p.payoutDisplay}`} strong />
                )}
                <Row label="Avg. Price" value={p.avgPriceDisplay !== "--" ? p.avgPriceDisplay : ""} />
                {!isBuy && (
                  <Row
                    label={`${p.selectedOutcome === "yes" ? "Yes" : "No"} Shares to sell:`}
                    value={p.sellEstLoading ? "..." : p.sellEstShares ?? "--"}
                  />
                )}
              </>
            )
          )}
        </div>
      )}

      {/* Submit, once there is something to submit, as in the original */}
      {showAction && (
        <button
          type="button"
          disabled={p.submitDisabled}
          onClick={() => {
            if (!p.selectedOutcome || !p.amount || p.successMessage) return;
            p.onSubmit();
          }}
          className={`btn h-12 w-full ${p.successMessage ? "btn-success cursor-default disabled:opacity-100" : "btn-primary"}`}
        >
          {p.successMessage ? (
            <>
              <Check size={16} weight="bold" aria-hidden />
              <span>{p.successMessage}</span>
            </>
          ) : p.tradeInProgress || p.tradePending ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper border-t-transparent" aria-hidden />
              <span>Completing trade…</span>
            </>
          ) : (
            "Submit Trade"
          )}
        </button>
      )}

      <div className="pt-2">
        <h3 className="font-mono text-small font-normal text-muted">Purchased Shares</h3>
        <Positions yes={p.yesSharesText} no={p.noSharesText} />
      </div>
    </div>
  );
}
