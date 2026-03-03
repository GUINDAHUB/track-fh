"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import type { PhaseTimingRow } from "@/lib/db";

type Props = {
  data: PhaseTimingRow[];
};

const faseLabels: Record<string, string> = {
  a: "A",
  b: "B",
  c: "C",
  d: "D",
  e: "E",
  f: "F",
  g: "G",
  h: "H",
  i: "I",
  conversacion_completa: "Conversación completa",
};

export function TimingsChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const chartData = data
    .filter((row) => row.avg_minutes != null)
    .map((row) => ({
      ...row,
      label: faseLabels[row.fase] ?? row.fase,
    }));

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, bottom: 0, left: 0, right: 16 }}
        >
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="label"
            width={80}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number) => [
              `${value.toFixed(1)} min`,
              "Tiempo medio",
            ]}
          />
          <Bar
            dataKey="avg_minutes"
            fill="#22c55e"
            radius={[0, 4, 4, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

