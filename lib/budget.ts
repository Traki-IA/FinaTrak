import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import type { TBudgetItemWithRelations } from "@/types";

export async function fetchBudgetItems(
  compteId: string
): Promise<TBudgetItemWithRelations[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("budget_items")
    .select("*, categories(*), objectifs(*)")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`fetchBudgetItems: ${error.message}`);
  return (data ?? []) as unknown as TBudgetItemWithRelations[];
}
