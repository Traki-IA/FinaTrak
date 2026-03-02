import MainLayoutShell from "@/components/MainLayoutShell";
import { fetchComptes, fetchNavOrder } from "@/lib/comptes";
import { getActiveCompteId, DEFAULT_COMPTE_ID } from "@/lib/active-compte";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let comptes: Awaited<ReturnType<typeof fetchComptes>> = [];
  let activeCompteId = DEFAULT_COMPTE_ID;
  let navOrder: string[] = [];
  let needsAccountFix = false;

  try {
    [comptes, navOrder] = await Promise.all([fetchComptes(), fetchNavOrder()]);
    activeCompteId = await getActiveCompteId();

    if (comptes.length > 0 && !comptes.find((c) => c.id === activeCompteId)) {
      activeCompteId = comptes[0].id;
      needsAccountFix = true;
    }
  } catch {
    // Supabase may not be configured during build
  }

  return (
    <MainLayoutShell
      comptes={comptes}
      activeCompteId={activeCompteId}
      navOrder={navOrder}
      needsAccountFix={needsAccountFix}
    >
      {children}
    </MainLayoutShell>
  );
}
