"use client";

import { createContext, useContext, useState } from "react";
import type { TCompte } from "@/types";

interface ICompteContext {
  comptes: TCompte[];
  activeCompteId: string;
  isSwitching: boolean;
  setIsSwitching: (v: boolean) => void;
}

const CompteContext = createContext<ICompteContext>({
  comptes: [],
  activeCompteId: "",
  isSwitching: false,
  setIsSwitching: () => {},
});

export function CompteProvider({
  comptes,
  activeCompteId,
  children,
}: Omit<ICompteContext, "isSwitching" | "setIsSwitching"> & { children: React.ReactNode }) {
  const [isSwitching, setIsSwitching] = useState(false);

  return (
    <CompteContext.Provider value={{ comptes, activeCompteId, isSwitching, setIsSwitching }}>
      {children}
    </CompteContext.Provider>
  );
}

export function useCompte() {
  return useContext(CompteContext);
}
