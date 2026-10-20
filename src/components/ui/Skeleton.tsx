import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

/** Text-shaped placeholder rows, matching the final layout's rhythm. */
export function SkeletonLines({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div aria-hidden className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-3.5" style={{ width: `${88 - (i % 3) * 14}%` }} />
      ))}
    </div>
  );
}
