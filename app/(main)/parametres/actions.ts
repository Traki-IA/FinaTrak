"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { upsertSoldeInitial } from "@/lib/dashboard";
import { requireUserId } from "@/lib/auth";

const SoldeInitialSchema = z.object({
  montant: z.number().finite(),
});

export async function updateSoldeInitial(
  compteId: string,
  montant: number
): Promise<{ success: true } | { error: string }> {
  const parsed = SoldeInitialSchema.safeParse({ montant });

  if (!parsed.success) {
    return { error: "Montant invalide" };
  }

  if (!z.string().uuid().safeParse(compteId).success) {
    return { error: "Compte invalide" };
  }

  try {
    await upsertSoldeInitial(compteId, parsed.data.montant);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[parametres] updateSoldeInitial:", err);
    return { error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

// ── Réorganisation des catégories ────────────────────────────────────────────

type TActionResult = { success: true } | { error: string };

const ReorderSchema = z.array(z.string().uuid()).max(100);

export async function reorderCategories(
  orderedIds: string[]
): Promise<TActionResult> {
  if (!ReorderSchema.safeParse(orderedIds).success) {
    return { error: "Données invalides" };
  }
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("user_id", userId);

    if (error) { console.error("[parametres] reorderCategories:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ── Mise à jour de l'ordre de navigation ─────────────────────────────────────

export async function updateNavOrder(
  orderedKeys: string[]
): Promise<TActionResult> {
  const userId = await requireUserId();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("settings")
    .upsert(
      { cle: "nav_order", valeur: JSON.stringify(orderedKeys), user_id: userId },
      { onConflict: "cle,user_id" }
    );

  if (error) { console.error("[parametres] updateNavOrder:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  revalidatePath("/", "layout");
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

  if (error) { console.error("[parametres] updateUserDisplayName:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<TProfileResult> {
  // Point 1 — minimum 8 caractères (NIST SP 800-63B / OWASP)
  const parsed = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").safeParse(newPassword);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide" };

  const supabase = await createServerSupabaseClient();

  // Point 2 — vérifier le mot de passe actuel avant de modifier
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Non authentifié" };

  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reAuthError) return { error: "Mot de passe actuel incorrect" };

  // Appliquer le nouveau mot de passe
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) { console.error("[parametres] updateUserPassword:", error.message); return { error: "Une erreur est survenue. Veuillez réessayer." }; }

  // Point 3 — invalider toutes les autres sessions actives
  await supabase.auth.signOut({ scope: "others" });

  // Point 4 — l'email de notification est géré par Supabase Auth
  // (activer dans Dashboard > Auth > Email Templates > "Password change notification")

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
  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (err) {
    console.error("[deleteAccount] Impossible de créer le client admin Supabase :", err);
    return { error: "Erreur de configuration serveur" };
  }

  const tables = ["budget_items", "transactions", "objectifs", "comptes", "categories", "settings"] as const;

  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) {
      console.error(`[deleteAccount] Error deleting ${table}:`, error.message);
      return { error: "Erreur lors de la suppression du compte" };
    }
  }

  // Supprimer le compte auth via l'API admin
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    console.error("[deleteAccount] Error deleting auth user:", deleteAuthError.message);
    return { error: "Erreur lors de la suppression du compte" };
  }

  // Déconnexion + redirection
  await supabase.auth.signOut();
  redirect("/auth");
}
