"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { TBalancePoint } from "@/types";

interface IBalanceLineProps {
  data: TBalancePoint[];
}

function formatTooltipValue(value: number): string {
  return value.toLocaleString("fr-FR") + " €";
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
        {formatTooltipValue(val)}
      </div>
    </div>
  );
}

export default function BalanceLine({ data }: IBalanceLineProps) {
  if (data.length === 0) {
    return (
      <div className="h-[190px] flex items-center justify-center text-[12px] text-[var(--text3)]">
        Aucune donnée
      </div>
    );
  }

  const moyenne = Math.round(
    data.reduce((acc, d) => acc + d.solde, 0) / data.length
  );

  // Granularité journalière si > 12 points → espacer les labels pour éviter l'entassement
  const isDaily = data.length > 12;
  const xInterval = isDaily ? Math.max(1, Math.floor(data.length / 5)) : "preserveStartEnd";

  return (
    <div className="h-[190px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
          <YAxis hide domain={["dataMin - 200", "dataMax + 200"]} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
          />
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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
