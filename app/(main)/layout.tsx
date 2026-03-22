import MainLayoutShell from "@/components/MainLayoutShell";
import { fetchComptes } from "@/lib/comptes";
import { getActiveCompteId } from "@/lib/active-compte";

export const revalidate = 30;

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeCompteId = "";
  let needsAccountFix = false;

  try {
    const comptes = await fetchComptes();
    const cookieCompteId = await getActiveCompteId();

    if (cookieCompteId && comptes.find((c) => c.id === cookieCompteId)) {
      activeCompteId = cookieCompteId;
    } else if (comptes.length > 0) {
      activeCompteId = comptes[0].id;
      needsAccountFix = cookieCompteId !== null;
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
