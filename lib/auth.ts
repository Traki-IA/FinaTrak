import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Récupère l'utilisateur courant authentifié via getUser().
 * Contrairement à getSession(), getUser() valide le token auprès
 * du serveur Supabase Auth — plus sécurisé.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

/**
 * Vérifie que l'utilisateur est authentifié.
 * Redirige vers /auth si non connecté.
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser();

  if (!user) {
    redirect('/auth');
  }

  return user;
}

/**
 * Retourne le user_id de l'utilisateur connecté.
 * Redirige vers /auth si pas de session.
 */
export async function requireUserId(): Promise<string> {
  const user = await requireAuth();
  return user.id;
}

/**
 * Déconnecte l'utilisateur et redirige vers /auth.
 */
export async function signOut(): Promise<never> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[auth] Erreur signOut:', error.message);
  }

  redirect('/auth');
}
