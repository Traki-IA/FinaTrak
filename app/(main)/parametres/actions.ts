"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { upsertSoldeInitial } from "@/lib/dashboard";
import { getActiveCompteId } from "@/lib/active-compte";
import { requireUserId } from "@/lib/auth";

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

  try {
    const compteId = await getActiveCompteId();
    await upsertSoldeInitial(compteId, parsed.data.montant);
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

// ── Réorganisation des catégories ────────────────────────────────────────────

type TActionResult = { success: true } | { error: string };

export async function reorderCategories(
  orderedIds: string[]
): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);

    if (error) return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

// ── Mise à jour de l'ordre de navigation ─────────────────────────────────────

export async function updateNavOrder(
  orderedKeys: string[]
): Promise<TActionResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("settings")
    .upsert(
      { cle: "nav_order", valeur: JSON.stringify(orderedKeys) },
      { onConflict: "cle" }
    );

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

// ── Mise à jour du profil utilisateur ────────────────────────────────────────

type TProfileResult = { success: true } | { error: string };

export async function updateUserDisplayName(
  displayName: string
): Promise<TProfileResult> {
  const parsed = z.string().min(1, "Le nom est requis").safeParse(displayName);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nom invalide" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: parsed.data },
  });

  if (error) return { error: error.message };

  revalidatePath("/parametres");
  return { success: true };
}

export async function updateUserPassword(
  newPassword: string
): Promise<TProfileResult> {
  const parsed = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").safeParse(newPassword);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) return { error: error.message };

  return { success: true };
}

// ── Suppression définitive du compte utilisateur ─────────────────────────────

const DeleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
});

export async function deleteUserAccount(
  confirmEmail: string
): Promise<{ error: string } | never> {
  const userId = await requireUserId();

  // Vérifier que l'email correspond à celui de l'utilisateur connecté
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié" };
  }

  const parsed = DeleteAccountSchema.safeParse({ confirmEmail });
  if (!parsed.success) {
    return { error: "Email invalide" };
  }

  if (parsed.data.confirmEmail.toLowerCase() !== user.email?.toLowerCase()) {
    return { error: "L'email ne correspond pas à votre compte" };
  }

  // Suppression en cascade des données (ordre FK : budget_items → transactions → objectifs → comptes)
  const admin = createAdminSupabaseClient();

  const tables = ["budget_items", "transactions", "objectifs", "comptes"] as const;

  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) {
      return { error: `Erreur lors de la suppression (${table}) : ${error.message}` };
    }
  }

  // Supprimer les settings liés (pas de user_id, suppression globale si nécessaire)
  // Note : les settings et categories sont globales, on ne les supprime pas

  // Supprimer le compte auth via l'API admin
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    return { error: `Erreur lors de la suppression du compte : ${deleteAuthError.message}` };
  }

  // Déconnexion + redirection
  await supabase.auth.signOut();
  redirect("/auth");
}
