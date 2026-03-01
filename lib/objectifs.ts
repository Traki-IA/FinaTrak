import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import type { TObjectif, TObjectifWithBudgetLines, TBudgetLineProgress } from "@/types";

export async function fetchObjectifs(
  compteId: string
): Promise<TObjectif[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("objectifs")
    .select("*")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`fetchObjectifs: ${error.message}`);
  return (data ?? []) as TObjectif[];
}

export async function fetchObjectifsWithBudgetLines(
  compteId: string
): Promise<TObjectifWithBudgetLines[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  // Récupérer les objectifs
  const { data: objectifs, error: objError } = await supabase
    .from("objectifs")
    .select("*")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (objError) throw new Error(`fetchObjectifsWithBudgetLines: ${objError.message}`);
  if (!objectifs || objectifs.length === 0) return [];

  const objectifIds = objectifs.map((o) => o.id);

  // Récupérer les lignes de budget liées aux objectifs
  const { data: budgetItems, error: biError } = await supabase
    .from("budget_items")
    .select("id, nom, montant, frequence, objectif_id")
    .eq("user_id", userId)
    .in("objectif_id", objectifIds);

  if (biError) throw new Error(`fetchObjectifsWithBudgetLines (budget_items): ${biError.message}`);

  const budgetItemIds = (budgetItems ?? []).map((bi) => bi.id);

  // Récupérer les transactions liées à ces lignes de budget
  let transactionSums: Record<string, number> = {};

  if (budgetItemIds.length > 0) {
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("budget_item_id, montant, type")
      .eq("user_id", userId)
      .in("budget_item_id", budgetItemIds);

    if (txError) throw new Error(`fetchObjectifsWithBudgetLines (transactions): ${txError.message}`);

    for (const tx of transactions ?? []) {
      if (!tx.budget_item_id) continue;
      transactionSums[tx.budget_item_id] = (transactionSums[tx.budget_item_id] ?? 0) + (tx.montant as number);
    }
  }

  // Assembler les résultats
  return (objectifs as TObjectif[]).map((objectif) => {
    const linkedItems = (budgetItems ?? []).filter((bi) => bi.objectif_id === objectif.id);

    const budget_lines: TBudgetLineProgress[] = linkedItems.map((bi) => {
      const consomme = transactionSums[bi.id] ?? 0;
      return {
        id: bi.id,
        nom: bi.nom as string,
        montant: bi.montant as number,
        frequence: bi.frequence as "mensuel" | "annuel",
        consomme,
        restant: Math.max(0, (bi.montant as number) - consomme),
      };
    });

    return { ...objectif, budget_lines };
  });
}
