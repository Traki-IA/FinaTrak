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
  categorie_id: z.string().uuid("Catégorie invalide").nullable(),
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
  categorie_id: z.string().uuid("Catégorie invalide").nullable(),
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

  // Vérifier que le compte appartient à l'utilisateur
  const { data: compte } = await supabase
    .from("comptes")
    .select("id")
    .eq("id", parsed.data.compte_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!compte) return { error: "Compte invalide" };

  const {
    creer_objectif,
    objectif_nom,
    objectif_cible,
    objectif_periode,
    ...itemData
  } = parsed.data;

  let objectif_id = itemData.objectif_id;

  // Vérifier que la catégorie appartient à l'utilisateur
  if (itemData.categorie_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("id", itemData.categorie_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!cat) return { error: "Catégorie invalide" };
  }

  // Vérifier que l'objectif existant appartient à l'utilisateur
  if (objectif_id && !creer_objectif) {
    const { data: existing } = await supabase
      .from("objectifs")
      .select("id")
      .eq("id", objectif_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) return { error: "Objectif invalide" };
  }

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

    if (objError || !newObjectif) { console.error("[budget] insertBudgetItem (objectif):", objError?.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }
    objectif_id = newObjectif.id as string;
  }

  const { error } = await supabase
    .from("budget_items")
    .insert([{ ...itemData, objectif_id, user_id: userId }]);

  if (error) { console.error("[budget] insertBudgetItem:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  revalidatePath("/", "layout");
  return { success: true };
}

// ── Toggle actif ──────────────────────────────────────────────────────────────

export async function toggleBudgetItem(
  id: string,
  actif: boolean
): Promise<TActionResult> {
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Identifiant invalide" };
  }
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("budget_items")
    .update({ actif })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) { console.error("[budget] toggleBudgetItem:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  revalidatePath("/", "layout");
  return { success: true };
}

// ── Suppression ───────────────────────────────────────────────────────────────

export async function deleteBudgetItem(id: string): Promise<TActionResult> {
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Identifiant invalide" };
  }
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("budget_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) { console.error("[budget] deleteBudgetItem:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  revalidatePath("/", "layout");
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

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { id, ...updateData } = parsed.data;

  const { error } = await supabase
    .from("budget_items")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) { console.error("[budget] updateBudgetItem:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  revalidatePath("/", "layout");
  return { success: true };
}

// ── Réorganisation ───────────────────────────────────────────────────────────

export async function reorderBudgetItems(
  orderedIds: string[]
): Promise<TActionResult> {
  if (!z.array(z.string().uuid()).max(100).safeParse(orderedIds).success) {
    return { error: "Données invalides" };
  }
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("budget_items")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("user_id", userId);

    if (error) { console.error("[budget] reorderBudgetItems:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
