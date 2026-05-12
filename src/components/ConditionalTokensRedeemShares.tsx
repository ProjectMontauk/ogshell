"use client";

import React, { useState } from "react";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { conditionalTokensContract } from "../../constants/contracts";

/** Same structural type as any `getContract(...)` CT instance from `constants/contracts`. */
export type ConditionalTokensContractInstance = typeof conditionalTokensContract;

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

function normalizeHex32(input: string, label: string): `0x${string}` {
  const t = input.trim();
  if (!t) throw new Error(`${label} is required`);
  const with0x = t.startsWith("0x") || t.startsWith("0X") ? t : `0x${t}`;
  const hex = with0x.slice(2).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error(`${label} must be 32 bytes (64 hex chars), with or without 0x`);
  }
  return `0x${hex}` as `0x${string}`;
}

function parseAddress(input: string, label: string): `0x${string}` {
  const t = input.trim();
  const with0x = t.startsWith("0x") || t.startsWith("0X") ? t : `0x${t}`;
  const hex = with0x.slice(2).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(hex)) {
    throw new Error(`${label} must be a 20-byte address (40 hex chars)`);
  }
  return `0x${hex}` as `0x${string}`;
}

function parseIndexSets(input: string): bigint[] {
  const t = input.trim();
  if (!t) return [1n];
  const parts = t.split(/[\s,]+/).filter(Boolean);
  const out: bigint[] = [];
  for (const p of parts) {
    const n = BigInt(p);
    if (n <= 0n) throw new Error(`Invalid index set: ${p}`);
    out.push(n);
  }
  return out.length ? out : [1n];
}

export type ConditionalTokensRedeemSharesProps = {
  conditionalTokensContract: ConditionalTokensContractInstance;
  /** Optional defaults (e.g. for a known resolved market). User can still edit before sending. */
  defaultCollateralToken?: string;
  defaultParentCollectionId?: string;
  defaultConditionId?: string;
  defaultIndexSets?: string;
  className?: string;
  /** Called when the user starts a new redeem (before wallet). May be async (e.g. snapshot balances). */
  onRedeemStart?: () => void | Promise<void>;
  /** After the redeem tx succeeds in the wallet — refresh balances / cash in the parent UI. Receives the tx result when available (for tx hash). */
  onRedeemSuccess?: (result?: unknown) => void | Promise<void>;
  /**
   * When true, redeem uses only `default*` values (hardcode them in `src/constants/marketRedeemDefaults.ts` per market).
   * No parameter inputs are shown — users only click Redeem.
   */
  hideParameterFields?: boolean;
};

/**
 * Calls Conditional Tokens `redeemPositions(collateralToken, parentCollectionId, conditionId, indexSets)`.
 * With `hideParameterFields`, values come only from `default*` props — hardcode them in `src/constants/marketRedeemDefaults.ts`.
 * With `hideParameterFields` false, the four fields are shown and editable.
 */
export default function ConditionalTokensRedeemShares({
  conditionalTokensContract,
  defaultCollateralToken = "",
  defaultParentCollectionId = ZERO_BYTES32,
  defaultConditionId = "",
  defaultIndexSets = "1",
  className = "",
  onRedeemStart,
  onRedeemSuccess,
  hideParameterFields = false,
}: ConditionalTokensRedeemSharesProps) {
  const { mutateAsync: sendTransactionAsync, isPending } = useSendTransaction();

  const [collateralToken, setCollateralToken] = useState(defaultCollateralToken);
  const [parentCollectionId, setParentCollectionId] = useState(defaultParentCollectionId);
  const [conditionId, setConditionId] = useState(defaultConditionId);
  const [indexSetsInput, setIndexSetsInput] = useState(defaultIndexSets);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setCollateralToken(defaultCollateralToken);
    setParentCollectionId(defaultParentCollectionId);
    setConditionId(defaultConditionId);
    setIndexSetsInput(defaultIndexSets);
  }, [defaultCollateralToken, defaultParentCollectionId, defaultConditionId, defaultIndexSets]);

  const onRedeem = async () => {
    setError(null);
    try {
      await onRedeemStart?.();
    } catch (err) {
      console.error("onRedeemStart failed:", err);
    }
    if (
      hideParameterFields &&
      (!defaultCollateralToken?.trim() || !defaultConditionId?.trim())
    ) {
      setError(
        "Redeem is not configured for this market yet. Add an entry in src/constants/marketRedeemDefaults.ts or pass hideParameterFields={false}.",
      );
      return;
    }
    try {
      const collateral = parseAddress(collateralToken, "Collateral token");
      const parent = normalizeHex32(parentCollectionId, "Parent collection id");
      const condition = normalizeHex32(conditionId, "Condition id");
      const indexSets = parseIndexSets(indexSetsInput);

      const transaction = prepareContractCall({
        contract: conditionalTokensContract,
        method:
          "function redeemPositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] indexSets)",
        params: [collateral, parent, condition, indexSets],
      });
      const result = await sendTransactionAsync(transaction);
      try {
        await onRedeemSuccess?.(result);
      } catch (err) {
        console.error("onRedeemSuccess callback failed:", err);
      }
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : String(e);
      setError(msg || "Redeem failed or was rejected.");
    }
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 text-sm ${className}`}>
      <h3 className="mb-2 text-base font-bold text-gray-900">Redeem positions</h3>
      <p className="mb-3 text-xs text-gray-600">
        {hideParameterFields
          ? "Redeem your winning position for this market. Your wallet will be asked to confirm one transaction; collateral is paid to your cash balance."
          : "After resolution, redeem winning collateral from the conditional tokens contract. Verify all fields match your condition; wrong values will revert."}
      </p>

      {!hideParameterFields && (
        <>
      <label className="mb-1 block text-xs font-semibold text-gray-700">Collateral token (address)</label>
      <input
        className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
        value={collateralToken}
        onChange={(e) => setCollateralToken(e.target.value)}
        placeholder="0x..."
        spellCheck={false}
      />

      <label className="mb-1 block text-xs font-semibold text-gray-700">Parent collection id (bytes32)</label>
      <input
        className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
        value={parentCollectionId}
        onChange={(e) => setParentCollectionId(e.target.value)}
        spellCheck={false}
      />

      <label className="mb-1 block text-xs font-semibold text-gray-700">Condition id (bytes32)</label>
      <input
        className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
        value={conditionId}
        onChange={(e) => setConditionId(e.target.value)}
        placeholder="0x..."
        spellCheck={false}
      />

      <label className="mb-1 block text-xs font-semibold text-gray-700">Index sets (comma-separated, e.g. 1 or 1,2)</label>
      <input
        className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
        value={indexSetsInput}
        onChange={(e) => setIndexSetsInput(e.target.value)}
        spellCheck={false}
      />
        </>
      )}

      {error && <div className="mb-2 text-xs text-red-600">{error}</div>}

      <button
        type="button"
        disabled={
          isPending ||
          (hideParameterFields &&
            (!defaultCollateralToken?.trim() || !defaultConditionId?.trim()))
        }
        onClick={onRedeem}
        className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet…" : "Redeem shares"}
      </button>
    </div>
  );
}
