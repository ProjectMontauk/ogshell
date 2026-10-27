import React from "react";

type Props = {
  /** Page heading; omit on pages whose first block is their own heading (market, portfolio). */
  title?: string;
  /** One or two sentences under the heading. */
  note?: React.ReactNode;
  /** Width of the centred column: reading and form pages use the default. */
  width?: "narrow" | "medium";
  children: React.ReactNode;
};

const WIDTH = { narrow: "max-w-3xl", medium: "max-w-5xl" };

/**
 * The page frame for single-column routes: a centred column inside the shared container,
 * same spacing everywhere, and a serif headline over an ink rule. Text inside stays left-aligned.
 */
export default function PageShell({ title, note, width = "narrow", children }: Props) {
  return (
    <div className="container-page pb-24 pt-10 md:pt-14">
      <div className={`mx-auto ${WIDTH[width]}`}>
        {title && (
          <header className="rule-bleed-b mb-8 pb-5 md:mb-10">
            <h1 className="serif text-[clamp(36px,5vw,56px)] font-bold leading-[0.95] tracking-[-0.03em] text-ink">{title}</h1>
            {note && <div className="serif mt-3 max-w-[65ch] text-lead text-ink-2">{note}</div>}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
