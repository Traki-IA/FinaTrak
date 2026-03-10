"use client";

import { motion } from "framer-motion";
import { SidebarProvider, useSidebar } from "@/components/SidebarContext";
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

function LayoutContent({
  comptes,
  activeCompteId,
  navOrder,
  needsAccountFix,
  solde,
  userName,
  userEmail,
  children,
}: IMainLayoutShellProps) {
  const { breakpoint, sidebarWidth } = useSidebar();

  return (
    <>
      <Navbar
        comptes={comptes}
        activeCompteId={activeCompteId}
        navOrder={navOrder}
        solde={solde}
        userName={userName}
        userEmail={userEmail}
      />
      {needsAccountFix && <AccountGuard compteId={activeCompteId} />}
      <motion.div
        className={breakpoint === "mobile" ? "pb-20" : ""}
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
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
