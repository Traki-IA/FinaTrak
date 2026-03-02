"use client";

import { SidebarProvider, useSidebar } from "@/components/SidebarContext";
import Navbar from "@/components/Navbar";
import AccountGuard from "@/components/AccountGuard";
import type { TCompte } from "@/types";

interface IMainLayoutShellProps {
  comptes: TCompte[];
  activeCompteId: string;
  navOrder: string[];
  needsAccountFix: boolean;
  children: React.ReactNode;
}

function LayoutContent({
  comptes,
  activeCompteId,
  navOrder,
  needsAccountFix,
  children,
}: IMainLayoutShellProps) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Navbar
        comptes={comptes}
        activeCompteId={activeCompteId}
        navOrder={navOrder}
      />
      {needsAccountFix && <AccountGuard compteId={activeCompteId} />}
      <div
        className={`pb-20 md:pb-0 transition-[margin-left] duration-300 ease-in-out ${
          collapsed ? "md:ml-16" : "md:ml-56"
        }`}
      >
        {children}
      </div>
    </>
  );
}

export default function MainLayoutShell(props: IMainLayoutShellProps) {
  return (
    <SidebarProvider>
      <LayoutContent {...props} />
    </SidebarProvider>
  );
}
