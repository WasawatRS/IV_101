"use client";

import type { ReactNode } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const C = {
  accent: "#2563eb",
  up: "#16a34a",
  down: "#dc2626",
  muted: "#9aa4b2",
  violet: "#7c3aed",
  amber: "#d97706",
  teal: "#0d9488",
  pink: "#db2777",
  grid: "#e2e6ed",
  gridDark: "#2a3140",
  axis: "#5b6472",
};

export const AXIS = {
  stroke: C.axis,
  fontSize: 11,
  tickFill: C.axis,
};

export function ChartBox({
  height = 300,
  children,
}: {
  height?: number;
  children: ReactNode;
}) {
  return (
    <div className="chartbox">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Grid() {
  return <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />;
}

export function Ax({
  xLabel,
  yLabel,
  yDomain,
  yWidth = 56,
}: {
  xLabel?: string;
  yLabel?: string;
  yDomain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
  yWidth?: number;
}) {
  return (
    <>
      <XAxis
        dataKey="x"
        {...AXIS}
        label={xLabel ? { value: xLabel, position: "insideBottom", offset: -4 } : undefined}
      />
      <YAxis
        {...AXIS}
        width={yWidth}
        domain={yDomain ?? ["auto", "auto"]}
        label={
          yLabel
            ? { value: yLabel, angle: -90, position: "insideLeft", offset: 8 }
            : undefined
        }
      />
    </>
  );
}

export function Tt({ unit }: { unit?: string }) {
  return (
    <Tooltip
      contentStyle={{
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "inherit",
      }}
      labelStyle={{ color: "var(--fg-muted)", fontSize: 12 }}
      formatter={(v, name) =>
        unit ? [`${v} ${unit}`, name] : [v, name]
      }
    />
  );
}

