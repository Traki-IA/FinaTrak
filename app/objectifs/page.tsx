import { Suspense } from "react";
import { fetchObjectifs } from "@/lib/objectifs";
import ObjectifsContent from "./ObjectifsContent";
import ObjectifsSkeleton from "./ObjectifsSkeleton";

export const dynamic = "force-dynamic";

async function ObjectifsData() {
  const objectifs = await fetchObjectifs();
  return <ObjectifsContent objectifs={objectifs} />;
}

export default function ObjectifsPage() {
  return (
    <Suspense fallback={<ObjectifsSkeleton />}>
      <ObjectifsData />
    </Suspense>
  );
}
