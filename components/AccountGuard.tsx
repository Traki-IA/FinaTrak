"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { switchCompte } from "@/app/comptes/actions";

/**
 * Composant invisible qui corrige le cookie `active_compte_id` lorsqu'il ne
 * correspond à aucun compte réel. Appelle `switchCompte` (Server Action)
 * pour persister le bon identifiant — ce qu'un Server Component ne peut pas
 * faire (cookies().set() n'est autorisé que dans les Server Actions / Route Handlers).
 */
export default function AccountGuard({ compteId }: { compteId: string }) {
  const router = useRouter();
  const didFix = useRef(false);

  useEffect(() => {
    if (didFix.current) return;
    didFix.current = true;

    switchCompte(compteId).then((result) => {
      if (!("error" in result)) {
        router.refresh();
      }
    });
  }, [compteId, router]);

  return null;
}
