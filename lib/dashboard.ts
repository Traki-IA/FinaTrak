import { supabase } from "@/lib/supabase";
import type {
  TDashboardStats,
  TTransactionWithCategorie,
  TDepenseCategorie,
  TBalancePoint,
  TCategorie,
} from "@/types";

// ── Helpers privés ───────────────────────────────────────────────────────────

/**
 * Retourne les bornes ISO (YYYY-MM-DD) du mois courant sans conversion UTC
 * pour éviter les décalages de timezone côté serveur.
 */
function getPeriodeBounds(): { debut: string; fin: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    debut: `${year}-${month}-01`,
    fin: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function labelMois(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

// ── Solde initial ────────────────────────────────────────────────────────────

export async function fetchSoldeInitial(): Promise<number> {
  const { data, error } = await supabase
    .from("settings")
    .select("valeur")
    .eq("cle", "solde_initial")
    .maybeSingle();

  if (error) {
    console.error("[dashboard] fetchSoldeInitial:", error.message);
    return 0;
  }

  return data ? Number(data.valeur) : 0;
}

export async function upsertSoldeInitial(montant: number): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert({ cle: "solde_initial", valeur: String(montant) });

  if (error) {
    throw new Error(`upsertSoldeInitial: ${error.message}`);
  }
}

// ── Fonctions exportées ──────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<TDashboardStats> {
  const { debut, fin } = getPeriodeBounds();

  console.log(`[dashboard] Période mois courant : ${debut} → ${fin}`);

  // Transactions du mois courant (pour revenus/dépenses/épargne du mois)
  const { data: monthData, error: monthError } = await supabase
    .from("transactions")
    .select("montant, type")
    .gte("date", debut)
    .lte("date", fin);

  if (monthError) {
    console.error("[dashboard] fetchDashboardStats (mois):", monthError.message);
    throw new Error(`fetchDashboardStats (mois): ${monthError.message}`);
  }

  // Toutes les transactions (pour le solde total cumulé)
  const { data: allData, error: allError } = await supabase
    .from("transactions")
    .select("montant, type");

  if (allError) {
    console.error("[dashboard] fetchDashboardStats (total):", allError.message);
    throw new Error(`fetchDashboardStats (total): ${allError.message}`);
  }

  const soldeInitial = await fetchSoldeInitial();

  const monthRows = monthData ?? [];
  const allRows = allData ?? [];

  console.log(
    `[dashboard] Transactions mois: ${monthRows.length}, Total: ${allRows.length}, Solde initial: ${soldeInitial}`
  );

  type TRow = { montant: number; type: string };

  // KPI mensuels
  const revenus = (monthRows as TRow[])
    .filter((t) => t.type === "revenu")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  const depenses = (monthRows as TRow[])
    .filter((t) => t.type === "depense")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  // Solde total = initial + tous les revenus - toutes les dépenses
  const totalRevenus = (allRows as TRow[])
    .filter((t) => t.type === "revenu")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  const totalDepenses = (allRows as TRow[])
    .filter((t) => t.type === "depense")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  const soldeTotal = soldeInitial + totalRevenus - totalDepenses;
  const epargne = revenus - depenses;

  console.log(
    `[dashboard] Revenus mois: ${revenus}, Dépenses mois: ${depenses}, Solde total: ${soldeTotal}, Épargne: ${epargne}`
  );

  return {
    soldeInitial,
    soldeTotal,
    revenus,
    depenses,
    epargne,
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
  const { debut, fin } = getPeriodeBounds();

  const { data, error } = await supabase
    .from("transactions")
    .select("montant, categories(nom, couleur)")
    .eq("type", "depense")
    .gte("date", debut)
    .lte("date", fin); // borne supérieure manquante corrigée

  if (error) {
    throw new Error(`fetchDepensesParCategorie: ${error.message}`);
  }

  const grouped = new Map<string, TDepenseCategorie>();

  for (const row of data ?? []) {
    const cat = row.categories as unknown as Pick<TCategorie, "nom" | "couleur"> | null;
    const nom = cat?.nom ?? "Autres";
    const couleur = cat?.couleur ?? "#94a3b8";

    const existing = grouped.get(nom);
    if (existing) {
      existing.valeur += Number(row.montant);
    } else {
      grouped.set(nom, { nom, valeur: Number(row.montant), couleur });
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
      entry.solde += Number(row.montant);
    } else {
      entry.solde -= Number(row.montant);
      entry.depenses += Number(row.montant);
    }

    monthly.set(mois, entry);
  }

  return Array.from(monthly.entries()).map(([mois, vals]) => ({
    mois,
    ...vals,
  }));
}
