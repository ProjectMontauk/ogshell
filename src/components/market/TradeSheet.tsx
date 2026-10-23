"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { useIsDesktop } from "../../hooks/useIsDesktop";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Ref to the panel element, used by the page to keep "click outside" logic working */
  panelRef?: React.RefObject<HTMLDivElement | null>;
};

const spring = { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.9 };

/** Trading lives in a sheet: slides in from the right on desktop, up from the bottom on phones. */
export default function TradeSheet({ open, onClose, title, children, panelRef }: Props) {
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const hidden = isDesktop ? { x: "100%" } : { y: "100%" };
  const shown = isDesktop ? { x: 0 } : { y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          />
          <motion.div
            ref={panelRef}
            className="sheet-safe absolute bg-surface shadow-[var(--shadow-float)] max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[88dvh] max-md:rounded-t-control md:inset-y-0 md:right-0 md:w-[400px]"
            initial={reduce ? false : hidden}
            animate={shown}
            exit={reduce ? undefined : hidden}
            transition={reduce ? { duration: 0 } : spring}
          >
            <div className="flex items-center justify-between border-b-4 border-double border-ink px-4 py-3 md:px-5">
              <h2 className="text-[18px] font-bold leading-tight text-ink">{title}</h2>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-sm -mr-2 h-8 w-8 px-0" aria-label="Close">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="max-h-[calc(88dvh-3.25rem)] overflow-y-auto px-4 py-4 md:max-h-[calc(100dvh-3.25rem)] md:px-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
