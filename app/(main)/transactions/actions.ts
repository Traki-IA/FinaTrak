"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const TransactionSchema = z.object({
  montant: z.number().positive("Le montant doit être positif"),
  type: z.enum(["revenu", "depense"]),
  categorie_id: z.string().nullable(),
  description: z.string().nullable(),
  date: z.string().min(1, "La date est requise"),
  compte_id: z.string().uuid("Compte invalide"),
  // objectif_id n'est pas stocké en base, il sert uniquement à mettre à jour la progression
  objectif_id: z.string().uuid().nullable().optional(),
  budget_item_id: z.string().uuid().nullable().optional(),
});

const UpdateTransactionSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
  montant: z.number().positive("Le montant doit être positif"),
  type: z.enum(["revenu", "depense"]),
  categorie_id: z.string().nullable(),
  description: z.string().nullable(),
  date: z.string().min(1, "La date est requise"),
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
  let objectifUpdated = false;
  if (objectif_id) {
    const { data: objectif } = await supabase
      .from("objectifs")
      .select("montant_actuel")
      .eq("id", objectif_id)
      .single();

    if (objectif) {
      const delta =
        parsed.data.type === "depense"
          ? -parsed.data.montant
          : parsed.data.montant;
      const nouveauMontant = Math.max(
        0,
        (objectif.montant_actuel as number) + delta
      );
      await supabase
        .from("objectifs")
        .update({ montant_actuel: nouveauMontant })
        .eq("id", objectif_id)
        .eq("user_id", userId);
      objectifUpdated = true;
    }

    revalidatePath("/objectifs");
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
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
  let objectifUpdated = false;
  if (objectif_id) {
    const { data: objectif } = await supabase
      .from("objectifs")
      .select("montant_actuel")
      .eq("id", objectif_id)
      .single();

    if (objectif) {
      const delta = parsed.data.type === "depense" ? -parsed.data.montant : parsed.data.montant;
      const nouveauMontant = Math.max(0, (objectif.montant_actuel as number) + delta);
      await supabase
        .from("objectifs")
        .update({ montant_actuel: nouveauMontant })
        .eq("id", objectif_id)
        .eq("user_id", userId);
      objectifUpdated = true;
    }

    revalidatePath("/objectifs");
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: true, objectifUpdated };
}

const UpsertCategorieSchema = z.object({
  id: z.string().uuid().optional(),
  nom: z.string().min(1, "Le nom est requis").max(50),
  couleur: z.string().min(1, "La couleur est requise"),
});

export async function upsertCategorie(input: {
  id?: string;
  nom: string;
  couleur: string;
}): Promise<{ success: true } | { error: string }> {
  const parsed = UpsertCategorieSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  if (parsed.data.id) {
    const { error } = await supabase
      .from("categories")
      .update({ nom: parsed.data.nom, couleur: parsed.data.couleur })
      .eq("id", parsed.data.id)
      .eq("user_id", userId);
    if (error) return { error: "Erreur lors de la mise à jour" };
  } else {
    const { error } = await supabase
      .from("categories")
      .insert([{ nom: parsed.data.nom, couleur: parsed.data.couleur, user_id: userId }]);
    if (error) return { error: "Erreur lors de la création" };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCategorie(
  id: string
): Promise<{ success: true } | { error: string }> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) { console.error("[transactions] deleteCategorie:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
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

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: true };
}

// ── Import CSV en masse ───────────────────────────────────────────────────────

const BulkRowSchema = z.object({
  date: z.string().min(1),
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

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: true, count: toInsert.length };
}
