import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Récupère la session utilisateur courante.
 * Retourne la session si l'utilisateur est connecté, null sinon.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[auth] Erreur getSession:', error.message);
    return null;
  }

  return data.session;
}

/**
 * Vérifie que l'utilisateur est authentifié.
 * Redirige vers /auth si aucune session active.
 * Retourne la session garantie non-null.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect('/auth');
  }

  return session;
}

/**
 * Retourne le user_id de la session active.
 * Redirige vers /auth si pas de session.
 * Centralise l'accès au user_id pour éviter la duplication.
 */
export async function requireUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}

/**
 * Déconnecte l'utilisateur et redirige vers /auth.
 * À utiliser dans un Server Action.
 */
export async function signOut(): Promise<never> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[auth] Erreur signOut:', error.message);
  }

  redirect('/auth');
}
