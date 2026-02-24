import { supabase } from "@/lib/supabase";
import type { TObjectif } from "@/types";

export async function fetchObjectifs(
  compteId: string
): Promise<TObjectif[]> {
  const { data, error } = await supabase
    .from("objectifs")
    .select("*")
    .eq("compte_id", compteId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`fetchObjectifs: ${error.message}`);
  return (data ?? []) as TObjectif[];
}
