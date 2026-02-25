"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Landmark, Wallet, CreditCard, PiggyBank, Building2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { switchCompte } from "@/app/comptes/actions";
import type { TCompte } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  landmark: Landmark,
  wallet: Wallet,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  building: Building2,
  banknote: Banknote,
};

function CompteIcon({ icone, size = 16, strokeWidth = 1.8 }: { icone: string; size?: number; strokeWidth?: number }) {
  const Icon = ICON_MAP[icone] ?? Landmark;
  return <Icon size={size} strokeWidth={strokeWidth} />;
}

interface IAccountSwitcherProps {
  comptes: TCompte[];
  activeCompteId: string;
}

export default function AccountSwitcher({ comptes, activeCompteId }: IAccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCompte = comptes.find((c) => c.id === activeCompteId) ?? comptes[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitch(compteId: string) {
    if (compteId === activeCompteId) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    const result = await switchCompte(compteId);

    if ("error" in result) {
      toast.error(result.error);
      setSwitching(false);
      setOpen(false);
    } else {
      setOpen(false);
      window.location.reload();
    }
  }

  if (!activeCompte) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={switching}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/[0.05] transition-all"
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${activeCompte.couleur}20`, color: activeCompte.couleur }}
        >
          <CompteIcon icone={activeCompte.icone} size={15} strokeWidth={2} />
        </span>
        <span className="truncate flex-1 text-left">{activeCompte.nom}</span>
        <ChevronDown
          size={14}
          className={`text-white/30 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 bg-[#111122] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50"
          >
            {comptes.map((compte) => {
              const isActive = compte.id === activeCompte?.id;
              return (
                <button
                  key={compte.id}
                  onClick={() => handleSwitch(compte.id)}
                  disabled={switching}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/[0.05] text-white"
                      : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
                    style={{ backgroundColor: `${compte.couleur}20`, color: compte.couleur }}
                  >
                    <CompteIcon icone={compte.icone} size={13} strokeWidth={2} />
                  </span>
                  <span className="truncate flex-1 text-left">{compte.nom}</span>
                  {isActive && <Check size={14} className="text-orange-400 flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { CompteIcon, ICON_MAP };
