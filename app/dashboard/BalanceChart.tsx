"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TDataPoint = {
  mois: string;
  solde: number;
  depenses: number;
};

const TOOLTIP_STYLE = {
  background: "#13131a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "12px",
};

const formatEur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

type IBalanceChartProps = {
  data: TDataPoint[];
};

export default function BalanceChart({ data }: IBalanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSolde" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradDepenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="mois"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number, name: string) => [
            formatEur(v),
            name === "solde" ? "Solde" : "Dépenses",
          ]}
        />
        <Area
          type="monotone"
          dataKey="solde"
          stroke="#f97316"
          strokeWidth={2}
          fill="url(#gradSolde)"
          dot={false}
          activeDot={{ r: 4, fill: "#f97316" }}
        />
        <Area
          type="monotone"
          dataKey="depenses"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#gradDepenses)"
          dot={false}
          activeDot={{ r: 4, fill: "#6366f1" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
