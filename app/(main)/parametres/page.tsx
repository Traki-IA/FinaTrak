import { Suspense } from "react";
import ParametresContent from "./ParametresContent";
import { fetchComptes } from "@/lib/comptes";
import { getActiveCompteId } from "@/lib/active-compte";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ParametresData() {
  const [session, compteId, comptes] = await Promise.all([
    requireAuth(),
    getActiveCompteId(),
    fetchComptes(),
  ]);

  return (
    <ParametresContent
      comptes={comptes}
      activeCompteId={compteId}
      userEmail={session.user.email ?? ""}
    />
  );
}

export default function ParametresPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <ParametresData />
    </Suspense>
  );
}
