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
});

export type TInsertTransactionInput = z.infer<typeof TransactionSchema>;

type TActionResult = { success: true } | { error: string };

export async function insertTransaction(
  input: TInsertTransactionInput
): Promise<TActionResult> {
  const parsed = TransactionSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Données invalides" };
  }

  const { error } = await supabase
    .from("transactions")
    .insert([parsed.data]);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  return { success: true };
}
