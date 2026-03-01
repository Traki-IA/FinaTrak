"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { setActiveCompteId } from "@/lib/active-compte";

// ── Schémas ───────────────────────────────────────────────────────────────────

const CompteSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  couleur: z.string().min(1, "La couleur est requise"),
  icone: z.string().min(1, "L'icône est requise"),
  solde_initial: z.number().finite(),
});

const UpdateCompteSchema = CompteSchema.extend({
  id: z.string().uuid("Identifiant invalide"),
});

export type TInsertCompteInput = z.infer<typeof CompteSchema>;
export type TUpdateCompteInput = z.infer<typeof UpdateCompteSchema>;

type TActionResult = { success: true } | { error: string };

// ── Insertion ─────────────────────────────────────────────────────────────────

export async function insertCompte(
  input: TInsertCompteInput
): Promise<TActionResult> {
  const parsed = CompteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  // Calculer le prochain sort_order
  const { data: last } = await supabase
    .from("comptes")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("comptes")
    .insert([{ ...parsed.data, sort_order: nextOrder, user_id: userId }]);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

// ── Mise à jour ──────────────────────────────────────────────────────────────

export async function updateCompte(
  input: TUpdateCompteInput
): Promise<TActionResult> {
  const parsed = UpdateCompteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createServerSupabaseClient();
  const { id, ...updateData } = parsed.data;

  const { error } = await supabase
    .from("comptes")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

// ── Suppression ───────────────────────────────────────────────────────────────

export async function deleteCompte(id: string): Promise<TActionResult> {
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Identifiant invalide" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  // Vérifier qu'il reste au moins un compte pour cet utilisateur
  const { count } = await supabase
    .from("comptes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) <= 1) {
    return { error: "Impossible de supprimer le dernier compte" };
  }

  const { error } = await supabase.from("comptes").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

// ── Réorganisation ───────────────────────────────────────────────────────────

export async function reorderComptes(
  orderedIds: string[]
): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("comptes")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

// ── Changement de compte actif ───────────────────────────────────────────────

export async function switchCompte(compteId: string): Promise<TActionResult> {
  if (!z.string().uuid().safeParse(compteId).success) {
    return { error: "Identifiant invalide" };
  }

  await setActiveCompteId(compteId);
  revalidatePath("/", "layout");
  return { success: true };
}

