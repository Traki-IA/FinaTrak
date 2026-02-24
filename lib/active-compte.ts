import { cookies } from "next/headers";

const COOKIE_KEY = "active_compte_id";
const DEFAULT_COMPTE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Lit le compte actif depuis le cookie (Server Component / Server Action).
 * Retourne l'UUID par défaut si aucun cookie n'est défini.
 */
export async function getActiveCompteId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_KEY)?.value ?? DEFAULT_COMPTE_ID;
}

/**
 * Définit le compte actif via un cookie persistant (1 an).
 * À appeler dans une Server Action.
 */
export async function setActiveCompteId(compteId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEY, compteId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });
}

export { DEFAULT_COMPTE_ID };
