import { supabase } from "@/lib/supabase";
import type {
  TDashboardStats,
  TTransactionWithCategorie,
  TDepenseCategorie,
  TBalancePoint,
  TCategorie,
} from "@/types";

// ── Helpers privés ───────────────────────────────────────────────────────────

function getPeriodeBounds(): { debut: string; fin: string } {
  const now = new Date();
  const debut = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { debut, fin };
}

function labelMois(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

// ── Fonctions exportées ──────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<TDashboardStats> {
  const { debut, fin } = getPeriodeBounds();

  const { data, error } = await supabase
    .from("transactions")
    .select("montant, type")
    .gte("date", debut)
    .lte("date", fin);

  if (error) {
    throw new Error(`fetchDashboardStats: ${error.message}`);
  }

  const rows = data ?? [];

  const revenus = rows
    .filter((t) => t.type === "revenu")
    .reduce((sum, t) => sum + (t.montant as number), 0);

  const depenses = rows
    .filter((t) => t.type === "depense")
    .reduce((sum, t) => sum + (t.montant as number), 0);

  return {
    soldeTotal: revenus - depenses,
    revenus,
    depenses,
    epargne: Math.max(0, revenus - depenses),
  };
}

export async function fetchRecentTransactions(): Promise<
  TTransactionWithCategorie[]
> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(*)")
    .order("date", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`fetchRecentTransactions: ${error.message}`);
  }

  return (data ?? []) as TTransactionWithCategorie[];
}

export async function fetchDepensesParCategorie(): Promise<
  TDepenseCategorie[]
> {
  const { debut } = getPeriodeBounds();

  const { data, error } = await supabase
    .from("transactions")
    .select("montant, categories(nom, couleur)")
    .eq("type", "depense")
    .gte("date", debut);

  if (error) {
    throw new Error(`fetchDepensesParCategorie: ${error.message}`);
  }

  // Regroupement par catégorie
  const grouped = new Map<string, TDepenseCategorie>();

  for (const row of data ?? []) {
    const cat = row.categories as Pick<TCategorie, "nom" | "couleur"> | null;
    const nom = cat?.nom ?? "Autres";
    const couleur = cat?.couleur ?? "#94a3b8";

    const existing = grouped.get(nom);
    if (existing) {
      existing.valeur += row.montant as number;
    } else {
      grouped.set(nom, { nom, valeur: row.montant as number, couleur });
    }
  }

  return Array.from(grouped.values());
}

export async function fetchBalanceHistory(): Promise<TBalancePoint[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("montant, type, date")
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`fetchBalanceHistory: ${error.message}`);
  }

  const monthly = new Map<string, { solde: number; depenses: number }>();

  for (const row of data ?? []) {
    const mois = labelMois(row.date as string);
    const entry = monthly.get(mois) ?? { solde: 0, depenses: 0 };

    if (row.type === "revenu") {
      entry.solde += row.montant as number;
    } else {
      entry.solde -= row.montant as number;
      entry.depenses += row.montant as number;
    }

    monthly.set(mois, entry);
  }

  return Array.from(monthly.entries()).map(([mois, vals]) => ({
    mois,
    ...vals,
  }));
}
