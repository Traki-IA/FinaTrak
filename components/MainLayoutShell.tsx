"use client";

import Navbar from "@/components/Navbar";
import AccountGuard from "@/components/AccountGuard";
import { CompteProvider } from "@/lib/compte-context";
import type { TCompte } from "@/types";

interface IMainLayoutShellProps {
  activeCompteId: string;
  needsAccountFix: boolean;
  comptes: TCompte[];
  children: React.ReactNode;
}

export default function MainLayoutShell({
  activeCompteId,
  needsAccountFix,
  comptes,
  children,
}: IMainLayoutShellProps) {
  return (
    <CompteProvider comptes={comptes} activeCompteId={activeCompteId}>
      <Navbar />
      {needsAccountFix && <AccountGuard compteId={activeCompteId} />}
      <div className="pb-20">{children}</div>
    </CompteProvider>
  );
}
