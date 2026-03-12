"use client";

import Navbar from "@/components/Navbar";
import AccountGuard from "@/components/AccountGuard";
import type { TCompte } from "@/types";

interface IMainLayoutShellProps {
  comptes: TCompte[];
  activeCompteId: string;
  navOrder: string[];
  needsAccountFix: boolean;
  solde?: number;
  userName?: string;
  userEmail?: string;
  children: React.ReactNode;
}

export default function MainLayoutShell({
  activeCompteId,
  needsAccountFix,
  children,
}: IMainLayoutShellProps) {
  return (
    <>
      <Navbar />
      {needsAccountFix && <AccountGuard compteId={activeCompteId} />}
      <div className="pb-20">{children}</div>
    </>
  );
}
