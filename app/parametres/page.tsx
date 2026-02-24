import { Suspense } from "react";
import ParametresContent from "./ParametresContent";
import { fetchSoldeInitial } from "@/lib/dashboard";
import { fetchComptes } from "@/lib/comptes";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

async function ParametresData() {
  const compteId = await getActiveCompteId();
  const [soldeInitial, comptes] = await Promise.all([
    fetchSoldeInitial(compteId),
    fetchComptes(),
  ]);

  return (
    <ParametresContent
      soldeInitial={soldeInitial}
      comptes={comptes}
      activeCompteId={compteId}
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
