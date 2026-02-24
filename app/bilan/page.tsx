import { Suspense } from "react";
import { fetchBilanData } from "@/lib/bilan";
import BilanContent from "./BilanContent";
import BilanSkeleton from "./BilanSkeleton";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

async function BilanData() {
  const compteId = await getActiveCompteId();
  const data = await fetchBilanData(compteId);

  return <BilanContent data={data} />;
}

export default function BilanPage() {
  return (
    <Suspense fallback={<BilanSkeleton />}>
      <BilanData />
    </Suspense>
  );
}
