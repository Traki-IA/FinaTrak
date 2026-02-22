import { Suspense } from "react";
import { fetchBilanData } from "@/lib/bilan";
import BilanContent from "./BilanContent";
import BilanSkeleton from "./BilanSkeleton";

export const dynamic = "force-dynamic";

async function BilanData() {
  const data = await fetchBilanData();
  return <BilanContent data={data} />;
}

export default function BilanPage() {
  return (
    <Suspense fallback={<BilanSkeleton />}>
      <BilanData />
    </Suspense>
  );
}
