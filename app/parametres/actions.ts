"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { upsertSoldeInitial } from "@/lib/dashboard";
import { getActiveCompteId } from "@/lib/active-compte";

const SoldeInitialSchema = z.object({
  montant: z.number().finite(),
});

export async function updateSoldeInitial(
  montant: number
): Promise<{ success: boolean; error?: string }> {
  const parsed = SoldeInitialSchema.safeParse({ montant });

  if (!parsed.success) {
    return { success: false, error: "Montant invalide" };
  }

  try {
    const compteId = await getActiveCompteId();
    await upsertSoldeInitial(compteId, parsed.data.montant);
    revalidatePath("/parametres");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

// ── Réorganisation des catégories ────────────────────────────────────────────

type TActionResult = { success: true } | { error: string };

export async function reorderCategories(
  orderedIds: string[]
): Promise<TActionResult> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

// ── Mise à jour de l'ordre de navigation ─────────────────────────────────────

export async function updateNavOrder(
  orderedKeys: string[]
): Promise<TActionResult> {
  const { error } = await supabase
    .from("settings")
    .upsert(
      { cle: "nav_order", valeur: JSON.stringify(orderedKeys) },
      { onConflict: "cle" }
    );

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
