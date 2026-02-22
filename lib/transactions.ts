import { supabase } from "@/lib/supabase";
import type { TTransactionWithCategorie, TCategorie } from "@/types";

export async function fetchAllTransactions(): Promise<
  TTransactionWithCategorie[]
> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(*)")
    .order("date", { ascending: false });

  if (error) throw new Error(`fetchAllTransactions: ${error.message}`);
  return (data ?? []) as TTransactionWithCategorie[];
}

export async function fetchCategories(): Promise<TCategorie[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("nom");

  if (error) throw new Error(`fetchCategories: ${error.message}`);
  return (data ?? []) as TCategorie[];
}
