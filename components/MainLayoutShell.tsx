"use client";

import Navbar from "@/components/Navbar";
import AccountGuard from "@/components/AccountGuard";

interface IMainLayoutShellProps {
  activeCompteId: string;
  needsAccountFix: boolean;
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
