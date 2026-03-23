"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { TCompte } from "@/types";

interface ICompteContext {
  comptes: TCompte[];
  activeCompteId: string;
  setActiveCompteId: (id: string) => void;
}

const CompteContext = createContext<ICompteContext>({
  comptes: [],
  activeCompteId: "",
  setActiveCompteId: () => {},
});

export function CompteProvider({
  comptes,
  activeCompteId: initialActiveCompteId,
  children,
}: { comptes: TCompte[]; activeCompteId: string; children: React.ReactNode }) {
  const [activeCompteId, setActive] = useState(initialActiveCompteId);

  const setActiveCompteId = useCallback((id: string) => {
    setActive(id);
  }, []);

  return (
    <CompteContext.Provider value={{ comptes, activeCompteId, setActiveCompteId }}>
      {children}
    </CompteContext.Provider>
  );
}

export function useCompte() {
  return useContext(CompteContext);
}
