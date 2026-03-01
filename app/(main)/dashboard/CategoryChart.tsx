"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TDepenseCategorie } from "@/types";

interface ICategoryChartProps {
  data: TDepenseCategorie[];
}

const TOOLTIP_STYLE = {
  background: "#13131a",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "12px",
};

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

export default function CategoryChart({ data }: ICategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[150px]">
        <p className="text-white/30 text-sm">Aucune donnée à afficher</p>
      </div>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data}
            dataKey="valeur"
            nameKey="nom"
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={68}
            strokeWidth={0}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.couleur} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number | undefined) => [formatEur(value ?? 0)]}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="mt-3 space-y-2">
        {data.map((cat) => (
          <li key={cat.nom} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: cat.couleur }}
              />
              <span className="text-white/55">{cat.nom}</span>
            </div>
            <span className="text-white font-medium tabular-nums">
              {formatEur(cat.valeur)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
