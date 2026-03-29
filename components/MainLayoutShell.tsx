"use client";

import Navbar from "@/components/Navbar";
import AccountGuard from "@/components/AccountGuard";
import { CompteProvider, useCompte } from "@/lib/compte-context";
import type { TCompte } from "@/types";

interface IMainLayoutShellProps {
  activeCompteId: string;
  needsAccountFix: boolean;
  comptes: TCompte[];
  children: React.ReactNode;
}

function LayoutContent({ needsAccountFix, activeCompteId, children }: {
  needsAccountFix: boolean;
  activeCompteId: string;
  children: React.ReactNode;
}) {
  const { isSwitching } = useCompte();

  return (
    <>
      <Navbar />
      {needsAccountFix && <AccountGuard compteId={activeCompteId} />}
      <div className={`pb-20 transition-opacity duration-200 ${isSwitching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        {children}
      </div>
    </>
  );
}

export default function MainLayoutShell({
  activeCompteId,
  needsAccountFix,
  comptes,
  children,
}: IMainLayoutShellProps) {
  return (
    <CompteProvider comptes={comptes} activeCompteId={activeCompteId}>
      <LayoutContent needsAccountFix={needsAccountFix} activeCompteId={activeCompteId}>
        {children}
      </LayoutContent>
    </CompteProvider>
  );
}
