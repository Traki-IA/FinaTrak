"use client";

import Navbar from "@/components/Navbar";
import { CompteProvider } from "@/lib/compte-context";
import type { TCompte } from "@/types";

interface IMainLayoutShellProps {
  comptes: TCompte[];
  children: React.ReactNode;
}

export default function MainLayoutShell({ comptes, children }: IMainLayoutShellProps) {
  return (
    <CompteProvider comptes={comptes}>
      <Navbar />
      <div className="pb-20">{children}</div>
    </CompteProvider>
  );
}
