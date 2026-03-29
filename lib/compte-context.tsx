"use client";

import { createContext, useContext } from "react";
import type { TCompte } from "@/types";

interface ICompteContext {
  comptes: TCompte[];
}

const CompteContext = createContext<ICompteContext>({ comptes: [] });

export function CompteProvider({
  comptes,
  children,
}: ICompteContext & { children: React.ReactNode }) {
  return (
    <CompteContext.Provider value={{ comptes }}>
      {children}
    </CompteContext.Provider>
  );
}

export function useCompte() {
  return useContext(CompteContext);
}
