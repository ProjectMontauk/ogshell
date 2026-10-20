"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import EvidenceItem, { type EvidenceRecord } from "./EvidenceItem";
import { Collapse } from "../ui/Collapse";

type SideProps = {
  side: "yes" | "no";
  label: string;
  items: EvidenceRecord[];
  showAll: boolean;
  onToggle: () => void;
  userVotes: Set<number>;
  votingId: number | null;
  contribution: (id: number, side: "yes" | "no") => number;
  onVote: (id: number, side: "yes" | "no") => void;
};

function CaseSide(p: SideProps) {
  // As on the original: the Yes side lists its top five until "View More"; the No side lists every document.
  const limited = p.side === "yes";
  const first = limited ? p.items.slice(0, 5) : p.items;
  const rest = limited ? p.items.slice(5) : [];
  const item = (ev: EvidenceRecord, idx: number) => (
    <EvidenceItem
      key={ev.id}
      evidence={ev}
      rank={idx + 1}
      lead={idx === 0}
      voted={p.userVotes.has(ev.id)}
      contribution={p.contribution(ev.id, p.side)}
      voting={p.votingId === ev.id}
      onVote={() => p.onVote(ev.id, p.side)}
    />
  );

  return (
    <section className="flex min-w-0 flex-col" aria-labelledby={`case-${p.side}`}>
      {/* The side's head: a mono kicker in the side's colour over an ink hairline */}
      <h3 id={`case-${p.side}`} className={`kicker hidden font-mono md:flex ${p.side === "yes" ? "text-yes" : "text-no"}`}>
        {p.label}
      </h3>

      <div className="flex-1">
        {p.items.length === 0 ? (
          <p className="serif py-4 text-[16px] text-muted">No evidence submitted yet.</p>
        ) : (
          <div data-reveal>
            <ol className="row-list">{first.map((ev, idx) => item(ev, idx))}</ol>
            {rest.length > 0 && (
              <Collapse open={p.showAll}>
                <ol className="row-list" start={6}>
                  {rest.map((ev, i) => item(ev, i + 5))}
                </ol>
              </Collapse>
            )}
          </div>
        )}
      </div>

      {p.items.length > 5 && (
        <div className="mt-5">
          <button type="button" onClick={p.onToggle} aria-expanded={p.showAll} className="btn btn-outline btn-sm">
            {p.showAll ? "View Less" : "View More"}
          </button>
        </div>
      )}
    </section>
  );
}

type Props = {
  labels: [string, string];
  yesItems: EvidenceRecord[];
  noItems: EvidenceRecord[];
  showAllYes: boolean;
  onToggleYes: () => void;
  showAllNo: boolean;
  onToggleNo: () => void;
  userVotes: Set<number>;
  votingId: number | null;
  contribution: (id: number, side: "yes" | "no") => number;
  onVote: (id: number, side: "yes" | "no") => void;
  mobileSide: "yes" | "no";
  onMobileSideChange: (s: "yes" | "no") => void;
};

/** Both sides' evidence side by side; on a phone, one side at a time behind the original tabs. */
export default function CaseColumns(p: Props) {
  const reduce = useReducedMotion();
  const shared = {
    userVotes: p.userVotes,
    votingId: p.votingId,
    contribution: p.contribution,
    onVote: p.onVote,
  };
  const yes = <CaseSide side="yes" label={p.labels[0]} items={p.yesItems} showAll={p.showAllYes} onToggle={p.onToggleYes} {...shared} />;
  const no = <CaseSide side="no" label={p.labels[1]} items={p.noItems} showAll={p.showAllNo} onToggle={p.onToggleNo} {...shared} />;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Evidence" className="tabs flex-nowrap gap-5 md:hidden">
        <button role="tab" type="button" aria-selected={p.mobileSide === "yes"} onClick={() => p.onMobileSideChange("yes")} className="tab h-auto flex-1 py-2 text-left aria-selected:text-yes">
          {p.labels[0]}
        </button>
        <button role="tab" type="button" aria-selected={p.mobileSide === "no"} onClick={() => p.onMobileSideChange("no")} className="tab h-auto flex-1 py-2 text-left aria-selected:text-no">
          {p.labels[1]}
        </button>
      </div>

      <div className="md:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.mobileSide}
            initial={reduce ? false : { opacity: 0, x: p.mobileSide === "yes" ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: p.mobileSide === "yes" ? 8 : -8 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            {p.mobileSide === "yes" ? yes : no}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Two columns divided by a hairline, as on a broadsheet */}
      <div className="hidden md:grid md:grid-cols-2">
        <div className="min-w-0 md:pr-6">{yes}</div>
        <div className="min-w-0 border-l border-rule md:pl-6">{no}</div>
      </div>
    </div>
  );
}
