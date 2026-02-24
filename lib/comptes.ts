import { supabase } from "@/lib/supabase";
import type { TCompte } from "@/types";

export async function fetchComptes(): Promise<TCompte[]> {
  const { data, error } = await supabase
    .from("comptes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`fetchComptes: ${error.message}`);
  return (data ?? []) as TCompte[];
}

export async function fetchNavOrder(): Promise<string[]> {
  const { data, error } = await supabase
    .from("settings")
    .select("valeur")
    .eq("cle", "nav_order")
    .maybeSingle();

  if (error) {
    console.error("[comptes] fetchNavOrder:", error.message);
    return [];
  }

  if (!data?.valeur) return [];

  try {
    const parsed = JSON.parse(data.valeur);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
