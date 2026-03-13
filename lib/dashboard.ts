import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import type {
  TDashboardStats,
  TTransactionWithCategorie,
  TDepenseCategorie,
  TBalancePoint,
  TCategorie,
  TPeriod,
  TBilanMois,
  TBilanCategorie,
} from "@/types";

// ── Helpers privés ───────────────────────────────────────────────────────────

function getPeriodBounds(period: TPeriod): { debut: string; fin: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const fin = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let startDate: Date;
  switch (period) {
    case "1m":
      startDate = new Date(year, month, 1);
      break;
    case "3m":
      startDate = new Date(year, month - 2, 1);
      break;
    case "6m":
      startDate = new Date(year, month - 5, 1);
      break;
    case "1y":
      startDate = new Date(year - 1, month + 1, 1);
      break;
  }

  const debut = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
  return { debut, fin };
}

function labelMois(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

function labelMoisFromKey(moisKey: string): string {
  const [year, month] = moisKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "fr-FR",
    { month: "short", year: "2-digit" }
  );
}

// ── Solde initial (depuis la table comptes) ──────────────────────────────────

export async function fetchSoldeInitial(compteId: string): Promise<number> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("comptes")
    .select("solde_initial")
    .eq("id", compteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[dashboard] fetchSoldeInitial:", error.message);
    return 0;
  }

  return data ? Number(data.solde_initial) : 0;
}

export async function fetchSoldeInitialIsSet(compteId: string): Promise<boolean> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("comptes")
    .select("id")
    .eq("id", compteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[dashboard] fetchSoldeInitialIsSet:", error.message);
    return false;
  }

  return data !== null;
}

export async function upsertSoldeInitial(
  compteId: string,
  montant: number
): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("comptes")
    .update({ solde_initial: montant })
    .eq("id", compteId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`upsertSoldeInitial: ${error.message}`);
  }
}

// ── Stats dashboard ──────────────────────────────────────────────────────────

export async function fetchDashboardStats(
  compteId: string,
  period: TPeriod = "1m"
): Promise<TDashboardStats> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { debut, fin } = getPeriodBounds(period);

  // Transactions de la période sélectionnée
  const { data: periodData, error: periodError } = await supabase
    .from("transactions")
    .select("montant, type")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .gte("date", debut)
    .lte("date", fin);

  if (periodError) {
    throw new Error(`fetchDashboardStats (period): ${periodError.message}`);
  }

  // Toutes les transactions du compte (pour le solde total cumulé)
  const { data: allData, error: allError } = await supabase
    .from("transactions")
    .select("montant, type")
    .eq("compte_id", compteId)
    .eq("user_id", userId);

  if (allError) {
    throw new Error(`fetchDashboardStats (total): ${allError.message}`);
  }

  const soldeInitial = await fetchSoldeInitial(compteId);

  const periodRows = periodData ?? [];
  const allRows = allData ?? [];

  type TRow = { montant: number; type: string };

  // KPI de la période
  const revenus = (periodRows as TRow[])
    .filter((t) => t.type === "revenu")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  const depenses = (periodRows as TRow[])
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
  const tauxEpargne = revenus > 0 ? (epargne / revenus) * 100 : 0;

  return {
    soldeInitial,
    soldeTotal,
    revenus,
    depenses,
    epargne,
    tauxEpargne,
  };
}

// ── Transactions récentes ────────────────────────────────────────────────────

export async function fetchRecentTransactions(
  compteId: string
): Promise<TTransactionWithCategorie[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(*)")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`fetchRecentTransactions: ${error.message}`);
  }

  return (data ?? []) as TTransactionWithCategorie[];
}

// ── Dépenses par catégorie (donut) ──────────────────────────────────────────

export async function fetchDepensesParCategorie(
  compteId: string,
  period: TPeriod = "1m"
): Promise<TDepenseCategorie[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { debut, fin } = getPeriodBounds(period);

  const { data, error } = await supabase
    .from("transactions")
    .select("montant, categories(nom, couleur)")
    .eq("type", "depense")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .gte("date", debut)
    .lte("date", fin);

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

// ── Historique du solde (area chart) ─────────────────────────────────────────

export async function fetchBalanceHistory(
  compteId: string,
  period: TPeriod = "1m"
): Promise<TBalancePoint[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { debut } = getPeriodBounds(period);

  // Solde cumulatif au début de la fenêtre = solde initial + toutes les transactions antérieures
  const soldeInitial = await fetchSoldeInitial(compteId);

  const { data: prevData, error: prevError } = await supabase
    .from("transactions")
    .select("montant, type")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .lt("date", debut);

  if (prevError) {
    throw new Error(`fetchBalanceHistory (prev): ${prevError.message}`);
  }

  let runningBalance = soldeInitial;
  for (const row of prevData ?? []) {
    runningBalance += row.type === "revenu" ? Number(row.montant) : -Number(row.montant);
  }

  // Transactions de la fenêtre, triées chronologiquement
  const { data, error } = await supabase
    .from("transactions")
    .select("montant, type, date")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .gte("date", debut)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`fetchBalanceHistory: ${error.message}`);
  }

  // Déltas nets par mois (flux mensuel)
  const deltas = new Map<string, { net: number; depenses: number }>();

  for (const row of data ?? []) {
    const mois = labelMois(row.date as string);
    const entry = deltas.get(mois) ?? { net: 0, depenses: 0 };

    if (row.type === "revenu") {
      entry.net += Number(row.montant);
    } else {
      entry.net -= Number(row.montant);
      entry.depenses += Number(row.montant);
    }

    deltas.set(mois, entry);
  }

  // Générer tous les mois de la fenêtre (debut → aujourd'hui) pour combler les trous
  const months: string[] = [];
  const periodStart = new Date(debut);
  const today = new Date();
  let cur = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);

  while (cur <= today) {
    months.push(labelMois(cur.toISOString().split("T")[0]));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  // Convertir en solde cumulatif réel, mois par mois
  const result: TBalancePoint[] = [];
  let cumulative = runningBalance;

  for (const mois of months) {
    const d = deltas.get(mois) ?? { net: 0, depenses: 0 };
    cumulative += d.net;
    result.push({ mois, solde: cumulative, depenses: d.depenses });
  }

  return result;
}

// ── Revenus vs Dépenses par mois (bar chart) ────────────────────────────────

export async function fetchRevenusDepensesParMois(
  compteId: string,
  period: TPeriod = "1m"
): Promise<TBilanMois[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { debut } = getPeriodBounds(period);

  const { data, error } = await supabase
    .from("transactions")
    .select("montant, type, date")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .gte("date", debut)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`fetchRevenusDepensesParMois: ${error.message}`);
  }

  const monthMap = new Map<string, TBilanMois>();

  for (const row of data ?? []) {
    const moisKey = (row.date as string).slice(0, 7);
    const entry = monthMap.get(moisKey) ?? {
      mois: labelMoisFromKey(moisKey),
      moisKey,
      revenus: 0,
      depenses: 0,
      epargne: 0,
    };
    if (row.type === "revenu") entry.revenus += Number(row.montant);
    else if (row.type === "depense") entry.depenses += Number(row.montant);
    entry.epargne = entry.revenus - entry.depenses;
    monthMap.set(moisKey, entry);
  }

  return Array.from(monthMap.values());
}

// ── Dépenses par catégorie détaillées (barres horizontales) ─────────────────

export async function fetchDepensesParCategorieDetailed(
  compteId: string,
  period: TPeriod = "1m"
): Promise<TBilanCategorie[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { debut, fin } = getPeriodBounds(period);

  const { data, error } = await supabase
    .from("transactions")
    .select("montant, categories(nom, couleur)")
    .eq("type", "depense")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .gte("date", debut)
    .lte("date", fin);

  if (error) {
    throw new Error(`fetchDepensesParCategorieDetailed: ${error.message}`);
  }

  const rows = data ?? [];
  const totalDepenses = rows.reduce((s, r) => s + Number(r.montant), 0);
  const catMap = new Map<string, TBilanCategorie>();

  for (const row of rows) {
    const cat = row.categories as unknown as Pick<TCategorie, "nom" | "couleur"> | null;
    const nom = cat?.nom ?? "Autres";
    const couleur = cat?.couleur ?? "#94a3b8";
    const entry = catMap.get(nom) ?? { nom, couleur, total: 0, pourcentage: 0 };
    entry.total += Number(row.montant);
    entry.pourcentage = totalDepenses > 0 ? (entry.total / totalDepenses) * 100 : 0;
    catMap.set(nom, entry);
  }

  return Array.from(catMap.values()).sort((a, b) => b.total - a.total);
}
