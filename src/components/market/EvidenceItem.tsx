"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "@phosphor-icons/react";

export type EvidenceRecord = {
  id: number;
  type: "yes" | "no";
  title: string;
  url?: string;
  description: string;
  netVotes: number;
  walletAddress: string;
  createdAt?: string;
  commentCount?: number;
};

export function isPdfUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("/uploads/evidence/") || u.includes("blob.vercel-storage.com") || u.endsWith(".pdf");
}

export function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type Props = {
  evidence: EvidenceRecord;
  rank: number;
  voted: boolean;
  contribution: number;
  voting: boolean;
  onVote: () => void;
  /** The best-supported document on its side: given room, a description and a larger numeral. */
  lead?: boolean;
};

/**
 * One filed document. The lead document on each side gets a larger title and its description;
 * otherwise every row has the same structure.
 */
export default function EvidenceItem({ evidence, rank, voted, contribution, voting, onVote, lead = false }: Props) {
  const router = useRouter();
  const side = evidence.type;
  // An outlined count until you vote; your vote then fills it with the side's colour.
  const fill = side === "yes" ? "bg-yes text-yes-ink" : "bg-no text-no-ink";
  const outline = "text-ink shadow-[inset_0_0_0_1px_var(--rule-2)] hover:shadow-[inset_0_0_0_1px_var(--ink)]";

  const voteButton = (
    <button
      type="button"
      onClick={onVote}
      disabled={voting}
      aria-pressed={voted}
      aria-label={voted ? "Remove vote" : "Upvote"}
      className={`touch inline-flex h-7 items-center gap-1.5 whitespace-nowrap px-2.5 text-small font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-out-quart active:scale-95 disabled:opacity-50 ${
        voted ? fill : outline
      }`}
    >
      <ArrowUp size={12} weight="bold" aria-hidden />
      <span className="num">{evidence.netVotes}</span>
      <span className="num opacity-70">{voted ? `+${contribution}` : "+0"}</span>
    </button>
  );

  // As on the original: the source sits in brackets after the title.
  const sourceTag = evidence.url ? ` (${isPdfUrl(evidence.url) ? "pdf" : getDomain(evidence.url)})` : "";
  const titleEl = evidence.url ? (
    <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="group">
      <span className="underline decoration-transparent decoration-1 underline-offset-[4px] transition-colors duration-200 group-hover:decoration-ink">{evidence.title}</span>
      <span className="font-normal text-muted">{sourceTag}</span>
    </a>
  ) : (
    <span>{evidence.title}</span>
  );

  // A ledger line: rank, the title in the serif with the discussion link under it, the vote on the right.
  // The lead document also carries its description.
  return (
    <li data-ui className="row-hover grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-3 border-b border-dotted border-rule py-3">
      <span className="num pt-0.5 text-small text-muted">#{rank}</span>
      <div className="min-w-0">
        <div className={`serif font-semibold leading-snug text-ink ${lead ? "text-[18px]" : "text-[16px]"}`}>{titleEl}</div>
        {lead && evidence.description && <p className="serif mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">{evidence.description}</p>}
        <button
          type="button"
          onClick={() => router.push(`/evidence/discussion/${evidence.id}`)}
          className="touch mt-1 inline-flex text-small text-muted transition-colors hover:text-ink"
        >
          View Discussion
        </button>
      </div>
      <div className="pt-0.5">{voteButton}</div>
    </li>
  );
}
