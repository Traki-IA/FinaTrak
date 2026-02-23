"use server";

import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const TransactionSchema = z.object({
  montant: z.number().positive("Le montant doit être positif"),
  type: z.enum(["revenu", "depense"]),
  categorie_id: z.string().nullable(),
  description: z.string().nullable(),
  date: z.string().min(1, "La date est requise"),
  // objectif_id n'est pas stocké en base, il sert uniquement à mettre à jour la progression
  objectif_id: z.string().uuid().nullable().optional(),
});

export type TInsertTransactionInput = z.infer<typeof TransactionSchema>;

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

  const { objectif_id, ...transactionData } = parsed.data;

  // Insertion de la transaction (sans objectif_id, colonne inexistante en base)
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
      const nouveauMontant =
        (objectif.montant_actuel as number) + parsed.data.montant;
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
