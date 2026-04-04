"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";

// ── Schéma de validation ──────────────────────────────────────────────────────

const UpsertCategorieSchema = z.object({
  id: z.string().uuid().optional(),
  nom: z.string().min(1, "Le nom est requis").max(50),
  couleur: z.string().min(1, "La couleur est requise"),
  icone: z.string().min(1).optional(),
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function upsertCategorie(input: {
  id?: string;
  nom: string;
  couleur: string;
  icone?: string;
}): Promise<{ success: true; id: string } | { error: string }> {
  const parsed = UpsertCategorieSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  if (parsed.data.id) {
    const updateData: Record<string, string> = {
      nom: parsed.data.nom,
      couleur: parsed.data.couleur,
    };
    if (parsed.data.icone) updateData.icone = parsed.data.icone;

    const { error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", parsed.data.id)
      .eq("user_id", userId);

    if (error) {
      console.error("[categories] upsertCategorie (update):", error.message);
      return { error: "Erreur lors de la mise à jour" };
    }

    revalidatePath("/", "layout");
    return { success: true, id: parsed.data.id };
  }

  // Calcul du prochain sort_order pour maintenir l'ordre d'affichage
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = ((last?.sort_order as number) ?? -1) + 1;

  const { data, error } = await supabase
    .from("categories")
    .insert([{
      nom: parsed.data.nom,
      couleur: parsed.data.couleur,
      icone: parsed.data.icone ?? "tag",
      sort_order: nextOrder,
      user_id: userId,
    }])
    .select("id")
    .single();

  if (error || !data) {
    console.error("[categories] upsertCategorie (insert):", error?.message);
    return { error: "Erreur lors de la création" };
  }

  revalidatePath("/", "layout");
  return { success: true, id: data.id as string };
}

export async function deleteCategorie(
  id: string
): Promise<{ success: true } | { error: string }> {
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Identifiant invalide" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[categories] deleteCategorie:", error.message);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
