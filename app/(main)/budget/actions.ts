"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Schémas ───────────────────────────────────────────────────────────────────

const BudgetItemSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  montant: z.number().positive("Le montant doit être positif"),
  frequence: z.enum(["mensuel", "annuel"]),
  categorie_id: z.string().nullable(),
  objectif_id: z.string().uuid().nullable(),
  compte_id: z.string().uuid("Compte invalide"),
  creer_objectif: z.boolean(),
  objectif_nom: z.string().nullable(),
  objectif_cible: z.number().positive().nullable(),
  objectif_periode: z.enum(["mensuel", "annuel", "ponctuel"]).nullable(),
});

const UpdateBudgetItemSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
  nom: z.string().min(1, "Le nom est requis"),
  montant: z.number().positive("Le montant doit être positif"),
  frequence: z.enum(["mensuel", "annuel"]),
  categorie_id: z.string().nullable(),
  objectif_id: z.string().uuid().nullable(),
});

export type TInsertBudgetItemInput = z.infer<typeof BudgetItemSchema>;
export type TUpdateBudgetItemInput = z.infer<typeof UpdateBudgetItemSchema>;

type TActionResult = { success: true } | { error: string };

// ── Insertion ─────────────────────────────────────────────────────────────────

export async function insertBudgetItem(
  input: TInsertBudgetItemInput
): Promise<TActionResult> {
  const parsed = BudgetItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const {
    creer_objectif,
    objectif_nom,
    objectif_cible,
    objectif_periode,
    ...itemData
  } = parsed.data;

  let objectif_id = itemData.objectif_id;

  // Créer l'objectif à la volée si demandé
  if (creer_objectif && objectif_nom && objectif_cible) {
    const { data: newObjectif, error: objError } = await supabase
      .from("objectifs")
      .insert([
        {
          nom: objectif_nom,
          montant_cible: objectif_cible,
          montant_actuel: 0,
          periode: objectif_periode ?? "ponctuel",
          compte_id: itemData.compte_id,
          user_id: userId,
        },
      ])
      .select("id")
      .single();

    if (objError) return { error: objError.message };
    objectif_id = newObjectif.id as string;
    revalidatePath("/objectifs");
  }

  const { error } = await supabase
    .from("budget_items")
    .insert([{ ...itemData, objectif_id, user_id: userId }]);

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return { success: true };
}

// ── Toggle actif ──────────────────────────────────────────────────────────────

export async function toggleBudgetItem(
  id: string,
  actif: boolean
): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("budget_items")
    .update({ actif })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return { success: true };
}

// ── Suppression ───────────────────────────────────────────────────────────────

export async function deleteBudgetItem(id: string): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("budget_items")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return { success: true };
}

// ── Mise à jour ──────────────────────────────────────────────────────────────

export async function updateBudgetItem(
  input: TUpdateBudgetItemInput
): Promise<TActionResult> {
  const parsed = UpdateBudgetItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createServerSupabaseClient();
  const { id, ...updateData } = parsed.data;

  const { error } = await supabase
    .from("budget_items")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return { success: true };
}

// ── Réorganisation ───────────────────────────────────────────────────────────

export async function reorderBudgetItems(
  orderedIds: string[]
): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("budget_items")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) return { error: error.message };
  }

  revalidatePath("/budget");
  return { success: true };
}
