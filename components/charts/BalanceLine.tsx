"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { TBalancePoint } from "@/types";

interface IBalanceLineProps {
  data: TBalancePoint[];
}

function CustomXTick({ x, y, payload, index, visibleTicksCount }: {
  x?: number; y?: number;
  payload?: { value: string };
  index?: number;
  visibleTicksCount?: number;
}) {
  const anchor =
    index === 0 ? "start"
    : index === (visibleTicksCount ?? 1) - 1 ? "end"
    : "middle";
  return (
    <text x={x} y={(y ?? 0) + 4} textAnchor={anchor} fill="#444" fontSize={10}>
      {payload?.value}
    </text>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div
      className="rounded-[14px] px-[12px] py-[9px]"
      style={{
        background: "rgba(28,28,30,0.95)",
        border: "1px solid var(--border)",
        minWidth: 110,
      }}
    >
      <div className="text-[11px] text-[var(--text3)] mb-[3px]">{label}</div>
      <div
        className="text-[18px] font-bold leading-none"
        style={{ color: "var(--orange)" }}
      >
        {val.toLocaleString("fr-FR")} €
      </div>
    </div>
  );
}

export default function BalanceLine({ data }: IBalanceLineProps) {
  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-[12px] text-[var(--text3)]">
        Aucune donnée
      </div>
    );
  }

  const lastPoint = data[data.length - 1];
  const moyenne = Math.round(
    data.reduce((acc, d) => acc + d.solde, 0) / data.length
  );

  const values = data.map((d) => d.solde);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;
  const padding = Math.max(range * 0.1, 200);
  const yDomain: [number, number] = [
    Math.floor(minVal - padding),
    Math.ceil(maxVal + padding),
  ];

  const isDaily = data.length > 12;
  const xInterval = isDaily
    ? Math.max(1, Math.floor(data.length / 5))
    : "preserveStartEnd";

  return (
    <div className="h-[210px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="soldeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--orange)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--orange)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <YAxis domain={yDomain} hide />

          <XAxis
            dataKey="mois"
            axisLine={false}
            tickLine={false}
            tick={<CustomXTick />}
            interval={xInterval}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
          />

          {/* Ligne moyenne */}
          <ReferenceLine
            y={moyenne}
            stroke="#333"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          <Area
            type="monotone"
            dataKey="solde"
            stroke="var(--orange)"
            strokeWidth={1.5}
            fill="url(#soldeGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--orange)",
              stroke: "#111",
              strokeWidth: 2,
            }}
          />

          {/* Point fixe sur le dernier solde */}
          <ReferenceDot
            x={lastPoint.mois}
            y={lastPoint.solde}
            r={5}
            fill="var(--orange)"
            stroke="#111111"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
