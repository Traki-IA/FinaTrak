import { Suspense } from "react";
import ComptesContent from "./ComptesContent";
import ComptesSkeleton from "./ComptesSkeleton";
import { fetchComptes } from "@/lib/comptes";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

async function ComptesData() {
  const [comptes, activeCompteId] = await Promise.all([
    fetchComptes(),
    getActiveCompteId(),
  ]);

  return <ComptesContent comptes={comptes} activeCompteId={activeCompteId} />;
}

export default function ComptesPage() {
  return (
    <Suspense fallback={<ComptesSkeleton />}>
      <ComptesData />
    </Suspense>
  );
}
