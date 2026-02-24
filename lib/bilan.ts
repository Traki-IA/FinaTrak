import { supabase } from "@/lib/supabase";
import type { TTransactionWithCategorie } from "@/types";

// ── Types exportés ────────────────────────────────────────────────────────────

export type TBilanMois = {
  mois: string;    // "jan. 25"
  moisKey: string; // "2025-01"
  revenus: number;
  depenses: number;
  epargne: number;
};

export type TBilanCategorie = {
  nom: string;
  couleur: string;
  total: number;
  pourcentage: number;
};

export type TBilanTotaux = {
  revenus: number;
  depenses: number;
  epargne: number;
  tauxEpargne: number;
};

export type TBilanData = {
  parMois: TBilanMois[];
  parCategorie: TBilanCategorie[];
  totaux: TBilanTotaux;
};

// ── Helper ────────────────────────────────────────────────────────────────────

function labelMois(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "fr-FR",
    { month: "short", year: "2-digit" }
  );
}

// ── Fetch principal ───────────────────────────────────────────────────────────

export async function fetchBilanData(compteId: string): Promise<TBilanData> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(*)")
    .eq("compte_id", compteId)
    .order("date", { ascending: true });

  if (error) throw new Error(`fetchBilanData: ${error.message}`);

  const rows = (data ?? []) as TTransactionWithCategorie[];

  // ── Regroupement par mois ─────────────────────────────────────────────────
  const monthMap = new Map<string, TBilanMois>();

  for (const row of rows) {
    const moisKey = row.date.slice(0, 7);
    const entry = monthMap.get(moisKey) ?? {
      mois: labelMois(moisKey),
      moisKey,
      revenus: 0,
      depenses: 0,
      epargne: 0,
    };
    if (row.type === "revenu") entry.revenus += row.montant;
    else entry.depenses += row.montant;
    entry.epargne = entry.revenus - entry.depenses;
    monthMap.set(moisKey, entry);
  }

  // ── Regroupement dépenses par catégorie ───────────────────────────────────
  const depenses = rows.filter((r) => r.type === "depense");
  const totalDepenses = depenses.reduce((s, r) => s + r.montant, 0);
  const catMap = new Map<string, TBilanCategorie>();

  for (const row of depenses) {
    const nom = row.categories?.nom ?? "Autres";
    const couleur = row.categories?.couleur ?? "#94a3b8";
    const entry = catMap.get(nom) ?? { nom, couleur, total: 0, pourcentage: 0 };
    entry.total += row.montant;
    entry.pourcentage =
      totalDepenses > 0 ? (entry.total / totalDepenses) * 100 : 0;
    catMap.set(nom, entry);
  }

  // ── Totaux globaux ────────────────────────────────────────────────────────
  const revenus = rows
    .filter((r) => r.type === "revenu")
    .reduce((s, r) => s + r.montant, 0);
  const totalDep = totalDepenses;
  const epargne = revenus - totalDep;
  const tauxEpargne = revenus > 0 ? (epargne / revenus) * 100 : 0;

  return {
    parMois: Array.from(monthMap.values()).slice(-12),
    parCategorie: Array.from(catMap.values()).sort((a, b) => b.total - a.total),
    totaux: { revenus, depenses: totalDep, epargne, tauxEpargne },
  };
}
