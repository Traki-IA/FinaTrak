"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TBalancePoint } from "@/types";

interface IBalanceChartProps {
  data: TBalancePoint[];
}

const TOOLTIP_STYLE = {
  background: "#13131a",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "12px",
};

// Données de démonstration affichées tant que Supabase n'a pas de données
const DEMO_DATA: TBalancePoint[] = [
  { mois: "Sep", solde: 3200, depenses: 1800 },
  { mois: "Oct", solde: 3800, depenses: 1650 },
  { mois: "Nov", solde: 3100, depenses: 2100 },
  { mois: "Déc", solde: 4200, depenses: 1400 },
  { mois: "Jan", solde: 3900, depenses: 1950 },
  { mois: "Fév", solde: 4650, depenses: 1850 },
];

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";
}

export default function BalanceChart({ data }: IBalanceChartProps) {
  const chartData = data.length > 0 ? data : DEMO_DATA;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
          formatter={(value: number | undefined, name: string | undefined) => [
            formatEur(value ?? 0),
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
          activeDot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="depenses"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#gradDepenses)"
          dot={false}
          activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
