"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  open: boolean;
  /** Height kept visible while closed (e.g. a few lines of a text preview). */
  collapsedHeight?: number | string;
  className?: string;
  children: React.ReactNode;
};

/** Height-animated disclosure. Closed content is inert, so it can't be tabbed into. */
export function Collapse({ open, collapsedHeight = 0, className = "", children }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? "auto" : collapsedHeight }}
      transition={reduce ? { duration: 0 } : { duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
      style={{ overflow: "hidden" }}
      className={className}
      inert={!open && collapsedHeight === 0}
    >
      {children}
    </motion.div>
  );
}
