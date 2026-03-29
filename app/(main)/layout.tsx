import MainLayoutShell from "@/components/MainLayoutShell";
import { fetchComptes } from "@/lib/comptes";
import type { TCompte } from "@/types";

export const revalidate = 30;

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let comptes: TCompte[] = [];

  try {
    comptes = await fetchComptes();
  } catch (err) {
    console.error("[layout] initialization failed:", err);
  }

  return (
    <MainLayoutShell comptes={comptes}>
      {children}
    </MainLayoutShell>
  );
}
