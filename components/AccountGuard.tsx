"use client";

import { useEffect, useRef } from "react";

/**
 * Composant invisible qui corrige le cookie `active_compte_id` lorsqu'il ne
 * correspond a aucun compte reel. Appelle le Route Handler /api/switch-compte
 * pour persister le bon identifiant via Set-Cookie explicite.
 */
export default function AccountGuard({ compteId }: { compteId: string }) {
  const didFix = useRef(false);

  useEffect(() => {
    if (didFix.current) return;
    didFix.current = true;

    fetch("/api/switch-compte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compteId }),
    }).then((res) => {
      if (res.ok) {
        window.location.reload();
      }
    });
  }, [compteId]);

  return null;
}
