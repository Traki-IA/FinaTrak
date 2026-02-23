"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { upsertSoldeInitial, fetchSoldeInitialIsSet } from "@/lib/dashboard";

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

  // Le solde initial ne peut être défini qu'une seule fois
  const alreadySet = await fetchSoldeInitialIsSet();
  if (alreadySet) {
    return {
      success: false,
      error: "Le solde initial a déjà été défini et ne peut pas être modifié.",
    };
  }

  try {
    await upsertSoldeInitial(parsed.data.montant);
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
