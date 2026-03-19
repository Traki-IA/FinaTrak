import MainLayoutShell from "@/components/MainLayoutShell";
import { fetchComptes } from "@/lib/comptes";
import { getActiveCompteId, DEFAULT_COMPTE_ID } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeCompteId = DEFAULT_COMPTE_ID;
  let needsAccountFix = false;

  try {
    const comptes = await fetchComptes();
    activeCompteId = await getActiveCompteId();

    if (comptes.length > 0 && !comptes.find((c) => c.id === activeCompteId)) {
      activeCompteId = comptes[0].id;
      needsAccountFix = true;
    }
  } catch (err) {
    console.error("[layout] initialization failed:", err);
  }

  return (
    <MainLayoutShell
      activeCompteId={activeCompteId}
      needsAccountFix={needsAccountFix}
    >
      {children}
    </MainLayoutShell>
  );
}
