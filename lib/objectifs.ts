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

// ── Type local pour la réponse nested Supabase ──────────────────────────────

type TBudgetItemNested = {
  id: string;
  nom: string;
  montant: number;
  frequence: string;
  categorie_id: string | null;
  transactions: Array<{
    budget_item_id: string;
    montant: number;
    type: string;
  }>;
};

type TObjectifNested = TObjectif & {
  budget_items: TBudgetItemNested[];
};

export async function fetchObjectifsWithBudgetLines(
  compteId: string
): Promise<TObjectifWithBudgetLines[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  // Requête unique avec joins imbriqués (objectifs → budget_items → transactions)
  const { data, error } = await supabase
    .from("objectifs")
    .select(
      `*,
      budget_items (
        id, nom, montant, frequence, categorie_id,
        transactions ( budget_item_id, montant, type )
      )`
    )
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`fetchObjectifsWithBudgetLines: ${error.message}`);
  if (!data || data.length === 0) return [];

  // Transformer la réponse nested en TObjectifWithBudgetLines[]
  return (data as TObjectifNested[]).map((objectif) => {
    const budget_lines: TBudgetLineProgress[] = (objectif.budget_items ?? []).map(
      (bi) => {
        const consomme = (bi.transactions ?? []).reduce(
          (sum, tx) => sum + tx.montant,
          0
        );
        return {
          id: bi.id,
          nom: bi.nom,
          montant: bi.montant,
          frequence: bi.frequence as "mensuel" | "annuel",
          categorie_id: bi.categorie_id,
          consomme,
          restant: Math.max(0, bi.montant - consomme),
        };
      }
    );

    const { budget_items: _, ...objectifData } = objectif;
    return { ...objectifData, budget_lines };
  });
}
