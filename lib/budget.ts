import { supabase } from "@/lib/supabase";
import type { TBudgetItemWithRelations } from "@/types";

export async function fetchBudgetItems(
  compteId: string
): Promise<TBudgetItemWithRelations[]> {
  const { data, error } = await supabase
    .from("budget_items")
    .select("*, categories(*), objectifs(*)")
    .eq("compte_id", compteId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`fetchBudgetItems: ${error.message}`);
  return (data ?? []) as unknown as TBudgetItemWithRelations[];
}
