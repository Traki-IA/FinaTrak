"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Helper privé ──────────────────────────────────────────────────────────────

// Incrémente montant_actuel d'un objectif en le plafonnant à montant_cible.
// Retourne true si la mise à jour a réussi, false sinon (erreur loggée).
async function applyObjectifProgress(
  supabase: SupabaseClient,
  objectifId: string,
  montant: number,
  userId: string
): Promise<boolean> {
  const { data: objectif, error: fetchError } = await supabase
    .from("objectifs")
    .select("montant_actuel, montant_cible")
    .eq("id", objectifId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !objectif) {
    console.error("[transactions] applyObjectifProgress fetch:", fetchError?.message);
    return false;
  }

  const nouveauMontant = Math.min(
    (objectif.montant_actuel as number) + montant,
    objectif.montant_cible as number
  );

  const { error: updateError } = await supabase
    .from("objectifs")
    .update({ montant_actuel: nouveauMontant })
    .eq("id", objectifId)
    .eq("user_id", userId);

  if (updateError) {
    console.error("[transactions] applyObjectifProgress update:", updateError.message);
    return false;
  }

  return true;
}

const TransactionSchema = z.object({
  montant: z.number().positive("Le montant doit être positif"),
  type: z.enum(["revenu", "depense"]),
  categorie_id: z.string().uuid("Catégorie invalide").nullable(),
  description: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  compte_id: z.string().uuid("Compte invalide"),
  // objectif_id n'est pas stocké en base, il sert uniquement à mettre à jour la progression
  objectif_id: z.string().uuid().nullable().optional(),
  budget_item_id: z.string().uuid().nullable().optional(),
});

const UpdateTransactionSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
  montant: z.number().positive("Le montant doit être positif"),
  type: z.enum(["revenu", "depense"]),
  categorie_id: z.string().uuid("Catégorie invalide").nullable(),
  description: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  objectif_id: z.string().uuid().nullable().optional(),
});

export type TInsertTransactionInput = z.infer<typeof TransactionSchema>;
export type TUpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

type TActionResult =
  | { success: true; objectifUpdated: boolean }
  | { error: string };

export async function insertTransaction(
  input: TInsertTransactionInput
): Promise<TActionResult> {
  const parsed = TransactionSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Données invalides" };
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

  const { objectif_id, budget_item_id, ...baseData } = parsed.data;

  // Construire les données à insérer (budget_item_id est stocké en base)
  const transactionData = {
    ...baseData,
    budget_item_id: budget_item_id ?? null,
    user_id: userId,
  };

  const { error } = await supabase
    .from("transactions")
    .insert([transactionData]);

  if (error) { console.error("[transactions] insertTransaction:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  // Mise à jour automatique de la progression de l'objectif lié
  const objectifUpdated = objectif_id
    ? await applyObjectifProgress(supabase, objectif_id, parsed.data.montant, userId)
    : false;

  revalidatePath("/", "layout");
  return { success: true, objectifUpdated };
}

export async function updateTransaction(
  input: TUpdateTransactionInput
): Promise<TActionResult> {
  const parsed = UpdateTransactionSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Données invalides" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { id, objectif_id, ...updateData } = parsed.data;

  const { error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) { console.error("[transactions] updateTransaction:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  // Mise à jour de la progression de l'objectif lié
  const objectifUpdated = objectif_id
    ? await applyObjectifProgress(supabase, objectif_id, parsed.data.montant, userId)
    : false;

  revalidatePath("/", "layout");
  return { success: true, objectifUpdated };
}

export async function deleteTransaction(
  id: string
): Promise<{ success: true } | { error: string }> {
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Identifiant invalide" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) { console.error("[transactions] deleteTransaction:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  revalidatePath("/", "layout");
  return { success: true };
}

// Met à jour la catégorie de TOUTES les transactions partageant la même description.
// Retourne le nombre de lignes affectées (peut être 0 si aucune correspondance).
export async function updateCategoryByDescription(
  description: string,
  categorieId: string | null
): Promise<{ success: true; affected: number } | { error: string }> {
  if (!description.trim()) return { error: "Description invalide" };

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error, count } = await supabase
    .from("transactions")
    .update({ categorie_id: categorieId }, { count: "exact" })
    .eq("user_id", userId)
    .eq("description", description);

  if (error) {
    console.error("[transactions] updateCategoryByDescription:", error.message);
    return { error: "Une erreur est survenue." };
  }

  revalidatePath("/", "layout");
  return { success: true, affected: count ?? 0 };
}

// ── Import CSV en masse ───────────────────────────────────────────────────────

const BulkRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  description: z.string().nullable(),
  montant: z.number().positive(),
  type: z.enum(["revenu", "depense"]),
  categorie_id: z.string().uuid().nullable(),
  compte_id: z.string().uuid(),
});

export async function bulkInsertTransactions(
  rows: z.infer<typeof BulkRowSchema>[]
): Promise<{ success: true; count: number } | { error: string }> {
  if (!rows.length) return { error: "Aucune transaction à importer." };
  if (rows.length > 500) return { error: "Maximum 500 transactions par import." };

  const parsed = z.array(BulkRowSchema).safeParse(rows);
  if (!parsed.success) return { error: "Données invalides." };

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  // Vérifier que tous les compte_id appartiennent à l'utilisateur
  const compteIds = [...new Set(parsed.data.map((r) => r.compte_id))];
  const { data: comptes } = await supabase
    .from("comptes")
    .select("id")
    .eq("user_id", userId)
    .in("id", compteIds);

  const validCompteIds = new Set((comptes ?? []).map((c) => c.id));
  if (compteIds.some((id) => !validCompteIds.has(id))) {
    return { error: "Compte invalide." };
  }

  // Vérifier que toutes les categorie_id appartiennent à l'utilisateur
  const categorieIds = [
    ...new Set(parsed.data.map((r) => r.categorie_id).filter((id): id is string => id !== null)),
  ];
  if (categorieIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .in("id", categorieIds);

    const validCategorieIds = new Set((categories ?? []).map((c) => c.id));
    if (categorieIds.some((id) => !validCategorieIds.has(id))) {
      return { error: "Catégorie invalide." };
    }
  }

  const toInsert = parsed.data.map((r) => ({
    date: r.date,
    description: r.description,
    montant: r.montant,
    type: r.type,
    categorie_id: r.categorie_id,
    compte_id: r.compte_id,
    user_id: userId,
  }));

  const { error } = await supabase.from("transactions").insert(toInsert);
  if (error) {
    console.error("[transactions] bulkInsertTransactions:", error.message);
    return { error: "Une erreur est survenue lors de l'import." };
  }

  revalidatePath("/", "layout");
  return { success: true, count: toInsert.length };
}
