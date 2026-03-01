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

  if (error) return { error: error.message };

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
        .eq("id", objectif_id);
      objectifUpdated = true;
    }

    revalidatePath("/objectifs");
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
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

  const supabase = await createServerSupabaseClient();
  const { id, ...updateData } = parsed.data;

  const { error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, objectifUpdated: false };
}

export async function deleteTransaction(
  id: string
): Promise<{ success: true } | { error: string }> {
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Identifiant invalide" };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}
