import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client Supabase sans gestion de session (usage legacy).
 * Préférer createServerSupabaseClient() pour les opérations authentifiées.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Crée un client Supabase serveur avec gestion des cookies de session.
 * À utiliser dans les Server Components, Server Actions et Route Handlers.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll appelé depuis un Server Component en lecture seule.
          // Ignoré ici car le middleware rafraîchit les sessions.
        }
      },
    },
  });
}
