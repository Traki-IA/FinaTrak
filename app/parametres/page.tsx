import { Suspense } from "react";
import ParametresContent from "./ParametresContent";
import { fetchSoldeInitial } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

async function ParametresData() {
  const soldeInitial = await fetchSoldeInitial();
  return <ParametresContent soldeInitial={soldeInitial} />;
}

export default function ParametresPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <ParametresData />
    </Suspense>
  );
}
