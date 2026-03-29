"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatEur } from "@/lib/format";
import type { TBudgetItemWithRelations } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

type TDistributionEntry = {
  id: string;
  nom: string;
  couleur: string;
  montant: number;
  pourcentage: number;
};

interface IBudgetDistributionProps {
  items: TBudgetItemWithRelations[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mensualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "annuel" ? montant / 12 : montant;
}

const TOOLTIP_STYLE = {
  background: "#13131a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "12px",
};

// ── Composant ────────────────────────────────────────────────────────────────

export default function BudgetDistribution({ items }: IBudgetDistributionProps) {
  const { data, total } = useMemo(() => {
    const actifs = items.filter((i) => i.actif);
    const byCategory = new Map<string, { nom: string; couleur: string; montant: number }>();

    for (const item of actifs) {
      const catId = item.categorie_id ?? "sans-categorie";
      const catNom = item.categories?.nom ?? "Sans catégorie";
      const catCouleur = item.categories?.couleur ?? "#94a3b8";
      const mensuel = mensualise(item.montant, item.frequence);

      const existing = byCategory.get(catId);
      if (existing) {
        existing.montant += mensuel;
      } else {
        byCategory.set(catId, { nom: catNom, couleur: catCouleur, montant: mensuel });
      }
    }

    const totalMensuel = actifs.reduce(
      (sum, i) => sum + mensualise(i.montant, i.frequence),
      0
    );

    const entries: TDistributionEntry[] = Array.from(byCategory.entries())
      .map(([id, { nom, couleur, montant }]) => ({
        id,
        nom,
        couleur,
        montant,
        pourcentage: totalMensuel > 0 ? (montant / totalMensuel) * 100 : 0,
      }))
      .sort((a, b) => b.montant - a.montant);

    return { data: entries, total: totalMensuel };
  }, [items]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-4">
          Répartition par catégorie
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Donut chart */}
          <div className="relative">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="montant"
                    nameKey="nom"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    strokeWidth={0}
                    paddingAngle={2}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.id} fill={entry.couleur} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number | undefined) => [formatEur(value ?? 0), "Mensuel"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Total au centre */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-lg font-bold text-white tabular-nums leading-none">
                  {formatEur(total)}
                </p>
                <p className="text-[11px] text-white/35 mt-1">/ mois</p>
              </div>
            </div>
          </div>

          {/* Légende avec barres de progression */}
          <div className="space-y-3">
            {data.map((entry) => (
              <div key={entry.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.couleur }}
                    />
                    <span className="text-xs text-white/60 truncate">
                      {entry.nom}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-white font-medium tabular-nums">
                      {formatEur(entry.montant)}
                    </span>
                    <span className="text-[11px] text-white/30 tabular-nums w-10 text-right">
                      {entry.pourcentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Barre de progression */}
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${entry.pourcentage}%`,
                      backgroundColor: entry.couleur,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
