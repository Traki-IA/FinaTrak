"use client";

import { createContext, useContext } from "react";
import type { TCompte } from "@/types";

interface ICompteContext {
  comptes: TCompte[];
  activeCompteId: string;
}

const CompteContext = createContext<ICompteContext>({
  comptes: [],
  activeCompteId: "",
});

export function CompteProvider({
  comptes,
  activeCompteId,
  children,
}: ICompteContext & { children: React.ReactNode }) {
  return (
    <CompteContext.Provider value={{ comptes, activeCompteId }}>
      {children}
    </CompteContext.Provider>
  );
}

export function useCompte() {
  return useContext(CompteContext);
}
