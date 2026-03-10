import MainLayoutShell from "@/components/MainLayoutShell";
import { fetchComptes, fetchNavOrder } from "@/lib/comptes";
import { getActiveCompteId, DEFAULT_COMPTE_ID } from "@/lib/active-compte";
import { getSession } from "@/lib/auth";
import { fetchDashboardStats } from "@/lib/dashboard";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let comptes: Awaited<ReturnType<typeof fetchComptes>> = [];
  let activeCompteId = DEFAULT_COMPTE_ID;
  let navOrder: string[] = [];
  let needsAccountFix = false;
  let solde: number | undefined;
  let userName: string | undefined;
  let userEmail: string | undefined;

  try {
    const [comptesResult, navOrderResult, session] = await Promise.all([
      fetchComptes(),
      fetchNavOrder(),
      getSession(),
    ]);

    comptes = comptesResult;
    navOrder = navOrderResult;
    activeCompteId = await getActiveCompteId();

    if (comptes.length > 0 && !comptes.find((c) => c.id === activeCompteId)) {
      activeCompteId = comptes[0].id;
      needsAccountFix = true;
    }

    if (session?.user) {
      userEmail = session.user.email;
      userName = (session.user.user_metadata?.full_name as string) ?? undefined;
    }

    if (comptes.length > 0) {
      try {
        const stats = await fetchDashboardStats(activeCompteId, "1m");
        solde = stats.soldeTotal;
      } catch {
        // Sidebar solde is optional
      }
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
      solde={solde}
      userName={userName}
      userEmail={userEmail}
    >
      {children}
    </MainLayoutShell>
  );
}
