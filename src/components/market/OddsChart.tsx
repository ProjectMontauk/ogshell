"use client";

import { useReducedMotion } from "motion/react";
import React, { useRef } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type OddsPoint = {
  /** ISO date or short label used on the x axis */
  timestamp: string;
  /** 0..1 */
  Yes: number;
  /** 0..1 */
  No: number;
};

type OddsChartProps = {
  data: OddsPoint[];
  height?: number;
  /** Date ticks along the baseline (case page) or none (front page). Axis, end labels and hover reading either way. */
  detailed?: boolean;
};

function pct(v: unknown) {
  return typeof v === "number" ? `${Math.round(v * 100)}%` : String(v ?? "");
}

function day(v: unknown) {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v ?? "") : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function shortDay(v: unknown) {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v ?? "") : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

const MONO = "var(--font-text), ui-monospace, monospace";

/**
 * The price history as a newspaper chart: two straight-segment lines (each point is a recorded
 * price), a baseline in ink, the scale on the right, and the latest value written at each line's end.
 */
export default function OddsChart({ data: incoming, height = 240, detailed = true }: OddsChartProps) {
  // The lines draw in on load, as on the original (Recharts default: 1.5s ease)
  const reduce = useReducedMotion();
  // Callers rebuild the points on every render; Recharts treats a new array as new data and
  // restarts the draw-in. Keep the previous array while the points are the same.
  const stable = useRef(incoming);
  if (stable.current !== incoming && JSON.stringify(stable.current) !== JSON.stringify(incoming)) stable.current = incoming;
  const data = stable.current;
  const lastIndex = data.length - 1;
  const last = data[lastIndex];
  const yesOnTop = last ? last.Yes >= last.No : true;
  const fontSize = detailed ? 11 : 10;

  // Only the newest point gets a dot and its value; the higher line is labelled above, the lower below.
  const endDot = (side: "yes" | "no") =>
    function EndDot(props: { cx?: number; cy?: number; index?: number }) {
      if (props.index !== lastIndex || props.cx == null || props.cy == null) return <g key={`d-${side}-${props.index}`} />;
      return <circle key={`d-${side}`} cx={props.cx} cy={props.cy} r={4} fill={`var(--${side})`} />;
    };
  const endLabel = (side: "yes" | "no") =>
    function EndLabel(props: { x?: number | string; y?: number | string; index?: number; value?: unknown }) {
      if (props.index !== lastIndex) return <g key={`l-${side}-${props.index}`} />;
      const above = side === "yes" ? yesOnTop : !yesOnTop;
      return (
        <text
          key={`l-${side}`}
          x={Number(props.x) - 8}
          y={Number(props.y) + (above ? -10 : 18)}
          textAnchor="end"
          fill={`var(--${side})`}
          // A halo in the page colour keeps the label legible where it crosses a line.
          stroke="var(--ground)"
          strokeWidth={4}
          paintOrder="stroke"
          strokeLinejoin="round"
          style={{ fontFamily: MONO, fontSize, fontWeight: 600 }}
        >
          {side === "yes" ? "Yes" : "No"} {pct(props.value)}
        </text>
      );
    };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="timestamp"
            axisLine={{ stroke: "var(--ink)", strokeWidth: 1.5 }}
            tickLine={detailed ? { stroke: "var(--ink)" } : false}
            tickSize={5}
            height={detailed ? 26 : 6}
            tick={detailed ? { fontSize, fill: "var(--muted)", fontFamily: MONO } : false}
            tickFormatter={shortDay}
            minTickGap={40}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            orientation="right"
            axisLine={false}
            tickLine={false}
            width={detailed ? 46 : 38}
            ticks={detailed ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]}
            tickFormatter={pct}
            tick={{ fontSize, fill: "var(--muted)", fontFamily: MONO }}
          />
          <Tooltip
            formatter={(v, name) => [pct(v), name]}
            labelFormatter={day}
            separator="  "
            cursor={{ stroke: "var(--ink)", strokeWidth: 1, strokeDasharray: "2 3" }}
            contentStyle={{
              background: "var(--ground)",
              border: "1px solid var(--ink)",
              borderRadius: 0,
              color: "var(--ink)",
              fontFamily: MONO,
              fontSize: 12,
              padding: "8px 12px",
            }}
            itemStyle={{ padding: 0, fontWeight: 600 }}
            labelStyle={{ color: "var(--muted)", marginBottom: 4 }}
          />
          <Line type="linear" dataKey="No" name="No" stroke="var(--no)" strokeWidth={2} dot={endDot("no")} label={endLabel("no")} activeDot={{ r: 4, strokeWidth: 0, fill: "var(--no)" }} isAnimationActive={!reduce} />
          <Line type="linear" dataKey="Yes" name="Yes" stroke="var(--yes)" strokeWidth={2.75} dot={endDot("yes")} label={endLabel("yes")} activeDot={{ r: 4, strokeWidth: 0, fill: "var(--yes)" }} isAnimationActive={!reduce} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
