import { supabase } from "@/lib/supabase";
import type { TObjectif } from "@/types";

export async function fetchObjectifs(): Promise<TObjectif[]> {
  const { data, error } = await supabase
    .from("objectifs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`fetchObjectifs: ${error.message}`);
  return (data ?? []) as TObjectif[];
}
