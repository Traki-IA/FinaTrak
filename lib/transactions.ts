import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import type {
  TTransactionWithCategorie,
  TCategorie,
  TTransactionFilters,
} from "@/types";

export async function fetchAllTransactions(
  compteId: string,
  filters?: TTransactionFilters
): Promise<TTransactionWithCategorie[]> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("transactions")
    .select("*, categories(*)")
    .eq("compte_id", compteId)
    .eq("user_id", userId);

  if (filters?.dateDebut) {
    query = query.gte("date", filters.dateDebut);
  }
  if (filters?.dateFin) {
    query = query.lte("date", filters.dateFin);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.categorie_ids && filters.categorie_ids.length > 0) {
    query = query.in("categorie_id", filters.categorie_ids);
  }
  if (filters?.montant_min !== undefined) {
    query = query.gte("montant", filters.montant_min);
  }
  if (filters?.montant_max !== undefined) {
    query = query.lte("montant", filters.montant_max);
  }

  const { data, error } = await query.order("date", { ascending: false });

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
