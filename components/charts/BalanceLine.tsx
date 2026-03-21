"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { TBalancePoint } from "@/types";

interface IBalanceLineProps {
  data: TBalancePoint[];
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
      className="rounded-lg px-[10px] py-[7px]"
      style={{
        background: "#1C1C1C",
        border: "1px solid var(--bg3)",
        minWidth: 90,
      }}
    >
      <div className="text-[10px] text-[var(--text3)] mb-0.5">{label}</div>
      <div className="text-[13px] font-medium text-[var(--text)]">
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

  const isDaily = data.length > 12;
  const xInterval = isDaily
    ? Math.max(1, Math.floor(data.length / 5))
    : "preserveStartEnd";

  return (
    <div className="h-[260px] relative">
      {/* Carte valeur courante — toujours visible, ancrée haut droite */}
      <div
        className="absolute top-[6px] right-[6px] z-10 rounded-[14px] px-[12px] py-[8px] text-right pointer-events-none"
        style={{
          background: "rgba(28,28,30,0.92)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="text-[11px] text-[var(--text3)] mb-[3px]">
          {lastPoint.mois}
        </div>
        <div
          className="text-[18px] font-bold leading-none"
          style={{ color: "var(--orange)" }}
        >
          {lastPoint.solde.toLocaleString("fr-FR")} €
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="soldeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--orange)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--orange)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="mois"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#444", fontSize: 10 }}
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

          {/* Ligne verticale pointillée au dernier point */}
          <ReferenceLine
            x={lastPoint.mois}
            stroke="rgba(249,115,22,0.25)"
            strokeDasharray="3 3"
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
