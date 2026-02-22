"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TBilanMois } from "@/lib/bilan";

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-white/50 text-xs mb-2 capitalize">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-medium" style={{ color: p.color }}>
          {p.name === "revenus" ? "Revenus" : "Dépenses"} :{" "}
          {formatEur(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function RevenusDepensesChart({ data }: { data: TBilanMois[] }) {
  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-white/25 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        barCategoryGap="30%"
        barGap={4}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="0"
        />
        <XAxis
          dataKey="mois"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="revenus" fill="#22c55e" radius={[6, 6, 0, 0]} />
        <Bar dataKey="depenses" fill="#f97316" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
