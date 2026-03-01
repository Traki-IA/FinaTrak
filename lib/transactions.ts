import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import type { TTransactionWithCategorie, TCategorie } from "@/types";

export async function fetchAllTransactions(
  compteId: string
): Promise<TTransactionWithCategorie[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(*)")
    .eq("compte_id", compteId)
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw new Error(`fetchAllTransactions: ${error.message}`);
  return (data ?? []) as TTransactionWithCategorie[];
}

export async function fetchCategories(): Promise<TCategorie[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`fetchCategories: ${error.message}`);
  return (data ?? []) as TCategorie[];
}
