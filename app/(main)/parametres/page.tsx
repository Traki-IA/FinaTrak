import { Suspense } from "react";
import ParametresContent from "./ParametresContent";
import { requireAuth } from "@/lib/auth";

export const revalidate = 30;

async function ParametresData() {
  const session = await requireAuth();

  return (
    <ParametresContent
      userEmail={session.user.email ?? ""}
      userDisplayName={session.user.user_metadata?.display_name ?? ""}
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
