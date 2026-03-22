import { cookies } from "next/headers";

const COOKIE_KEY = "active_compte_id";

/**
 * Lit le compte actif depuis le cookie (Server Component / Server Action).
 * Retourne null si aucun cookie n'est défini — le layout doit sélectionner
 * le premier compte de l'utilisateur dans ce cas.
 */
export async function getActiveCompteId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_KEY)?.value ?? null;
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
    secure: process.env.NODE_ENV === "production",
  });
}
