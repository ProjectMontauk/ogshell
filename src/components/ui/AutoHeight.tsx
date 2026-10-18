"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Animates its own height to whatever its children measure. The content itself is rendered by
 * the caller exactly as before; this only smooths the jump when it grows or shrinks.
 */
export function AutoHeight({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={reduce ? { duration: 0 } : { duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
      style={{ overflow: "hidden" }}
      className={className}
    >
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}
