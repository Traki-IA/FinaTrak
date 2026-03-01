"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ObjectifSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  montant_cible: z.number().positive("Le montant cible doit être positif"),
  montant_actuel: z.number().min(0, "Le montant actuel ne peut pas être négatif"),
  periode: z.enum(["mensuel", "annuel", "ponctuel"]),
  date_fin: z.string().nullable(),
  compte_id: z.string().uuid("Compte invalide"),
});

const UpdateObjectifSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
  nom: z.string().min(1, "Le nom est requis"),
  montant_cible: z.number().positive("Le montant cible doit être positif"),
  montant_actuel: z.number().min(0, "Le montant actuel ne peut pas être négatif"),
  periode: z.enum(["mensuel", "annuel", "ponctuel"]),
  date_fin: z.string().nullable(),
});

export type TInsertObjectifInput = z.infer<typeof ObjectifSchema>;
export type TUpdateObjectifInput = z.infer<typeof UpdateObjectifSchema>;

type TActionResult = { success: true } | { error: string };

export async function insertObjectif(
  input: TInsertObjectifInput
): Promise<TActionResult> {
  const parsed = ObjectifSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("objectifs")
    .insert([{ ...parsed.data, user_id: userId }]);

  if (error) return { error: error.message };

  revalidatePath("/objectifs");
  return { success: true };
}

export async function updateObjectif(
  input: TUpdateObjectifInput
): Promise<TActionResult> {
  const parsed = UpdateObjectifSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createServerSupabaseClient();
  const { id, ...updateData } = parsed.data;

  const { error } = await supabase
    .from("objectifs")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/objectifs");
  return { success: true };
}

export async function updateObjectifMontant(
  id: string,
  montant_actuel: number
): Promise<TActionResult> {
  if (montant_actuel < 0) return { error: "Montant invalide" };

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("objectifs")
    .update({ montant_actuel })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/objectifs");
  return { success: true };
}

export async function deleteObjectif(id: string): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("objectifs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/objectifs");
  return { success: true };
}

export async function reorderObjectifs(
  orderedIds: string[]
): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("objectifs")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) return { error: error.message };
  }

  revalidatePath("/objectifs");
  return { success: true };
}
