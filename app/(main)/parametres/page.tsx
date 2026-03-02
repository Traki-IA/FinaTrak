import { Suspense } from "react";
import ParametresContent from "./ParametresContent";
import { requireAuth } from "@/lib/auth";
import { fetchCategories } from "@/lib/transactions";

export const dynamic = "force-dynamic";

async function ParametresData() {
  const [session, categories] = await Promise.all([
    requireAuth(),
    fetchCategories(),
  ]);

  return (
    <ParametresContent
      userEmail={session.user.email ?? ""}
      userDisplayName={session.user.user_metadata?.display_name ?? ""}
      categories={categories}
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
