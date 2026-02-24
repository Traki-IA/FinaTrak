import { Suspense } from "react";
import { fetchObjectifs } from "@/lib/objectifs";
import ObjectifsContent from "./ObjectifsContent";
import ObjectifsSkeleton from "./ObjectifsSkeleton";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

async function ObjectifsData() {
  const compteId = await getActiveCompteId();
  const objectifs = await fetchObjectifs(compteId);

  return <ObjectifsContent objectifs={objectifs} compteId={compteId} />;
}

export default function ObjectifsPage() {
  return (
    <Suspense fallback={<ObjectifsSkeleton />}>
      <ObjectifsData />
    </Suspense>
  );
}
