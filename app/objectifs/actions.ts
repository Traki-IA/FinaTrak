"use server";

import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const ObjectifSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  montant_cible: z.number().positive("Le montant cible doit être positif"),
  montant_actuel: z.number().min(0, "Le montant actuel ne peut pas être négatif"),
  periode: z.enum(["mensuel", "annuel", "ponctuel"]),
  date_fin: z.string().nullable(),
});

export type TInsertObjectifInput = z.infer<typeof ObjectifSchema>;

type TActionResult = { success: true } | { error: string };

export async function insertObjectif(
  input: TInsertObjectifInput
): Promise<TActionResult> {
  const parsed = ObjectifSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { error } = await supabase.from("objectifs").insert([parsed.data]);
  if (error) return { error: error.message };

  revalidatePath("/objectifs");
  return { success: true };
}

export async function updateObjectifMontant(
  id: string,
  montant_actuel: number
): Promise<TActionResult> {
  if (montant_actuel < 0) return { error: "Montant invalide" };

  const { error } = await supabase
    .from("objectifs")
    .update({ montant_actuel })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/objectifs");
  return { success: true };
}

export async function deleteObjectif(id: string): Promise<TActionResult> {
  const { error } = await supabase.from("objectifs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/objectifs");
  return { success: true };
}
