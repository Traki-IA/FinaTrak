"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CompteIcon } from "@/components/compte-icons";
import CompteModal from "@/components/CompteModal";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { deleteCompte } from "@/app/(main)/comptes/actions";
import { useCompte } from "@/lib/compte-context";
import type { ReactNode } from "react";
import type { TCompte } from "@/types";

interface ILogoHeaderProps {
  rightSlot?: ReactNode;
}

export default function LogoHeader({ rightSlot }: ILogoHeaderProps) {
  const { comptes } = useCompte();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const compteParam = searchParams.get("compte");
  const activeCompte = comptes.find((c) => c.id === compteParam) ?? comptes[0];
  const hasComptes = comptes && comptes.length > 0 && activeCompte;

  const [open, setOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [compteModalOpen, setCompteModalOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<TCompte | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmingDeleteId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSwitch(compteId: string) {
    if (compteId === activeCompte?.id) {
      setOpen(false);
      return;
    }
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("compte", compteId);
    router.push(`${pathname}?${params.toString()}`);
  }

  function openAddModal() {
    setEditingCompte(undefined);
    setCompteModalOpen(true);
    setOpen(false);
  }

  function openEditModal(compte: TCompte, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingCompte(compte);
    setCompteModalOpen(true);
    setOpen(false);
  }

  async function handleDeleteConfirm(id: string) {
    setConfirmingDeleteId(null);
    const result = await deleteCompte(id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Compte supprimé");
      const remaining = comptes.filter((c) => c.id !== id);
      const fallback = remaining[0];
      if (fallback) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("compte", fallback.id);
        router.push(`${pathname}?${params.toString()}`);
      } else {
        router.refresh();
      }
    }
  }

  if (!hasComptes) {
    return (
      <div className="flex items-center justify-center gap-[9px] py-1 border-b border-[var(--bg2)] relative">
        <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--orange)] flex items-center justify-center text-[13px] font-semibold text-white">
          F
        </div>
        <div className="text-[15px] font-medium tracking-[-0.02em] text-[var(--text)]">
          Fina<span className="text-[var(--orange)] font-medium">Trak</span>
        </div>
        {rightSlot && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center py-1 border-b border-[var(--bg2)] relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-[8px] px-1 py-0.5 rounded-lg hover:bg-white/[0.04] transition-colors mx-auto"
        >
          <span
            className="flex items-center justify-center w-[26px] h-[26px] rounded-[7px] flex-shrink-0"
            style={{ backgroundColor: `${activeCompte.couleur}20`, color: activeCompte.couleur }}
          >
            <CompteIcon icone={activeCompte.icone} size={14} strokeWidth={2} />
          </span>
          <span className="text-[15px] font-medium tracking-[-0.02em] text-[var(--text)] truncate max-w-[180px]">
            {activeCompte.nom}
          </span>
          <ChevronDown
            size={13}
            className={`text-[var(--text3)] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {rightSlot && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-2 right-2 top-full mt-1 bg-[var(--bg2)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50"
          >
            {comptes.map((compte) => {
              const isActive = compte.id === activeCompte.id;
              const isConfirming = confirmingDeleteId === compte.id;
              return (
                <div
                  key={compte.id}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors group ${
                    isActive
                      ? "bg-white/[0.05] text-[var(--text)]"
                      : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-white/[0.04]"
                  }`}
                >
                  <button
                    onClick={() => handleSwitch(compte.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0"
                  >
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
                      style={{ backgroundColor: `${compte.couleur}20`, color: compte.couleur }}
                    >
                      <CompteIcon icone={compte.icone} size={13} strokeWidth={2} />
                    </span>
                    <span className="truncate flex-1 text-left">{compte.nom}</span>
                    {isActive && <Check size={14} className="text-[var(--orange)] flex-shrink-0" />}
                  </button>

                  <div className={`flex items-center gap-0.5 flex-shrink-0 ${isConfirming ? "opacity-100" : "opacity-40 hover:opacity-100"} transition-opacity`}>
                    {!isConfirming && (
                      <button
                        onClick={(e) => openEditModal(compte, e)}
                        className="p-1 rounded-md text-[var(--text3)] hover:text-[var(--text)] hover:bg-white/[0.07] transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                    <ConfirmDeleteButton
                      isConfirming={isConfirming}
                      onDeleteRequest={() => setConfirmingDeleteId(compte.id)}
                      onDeleteConfirm={() => handleDeleteConfirm(compte.id)}
                      onDeleteCancel={() => setConfirmingDeleteId(null)}
                      size={11}
                    />
                  </div>
                </div>
              );
            })}

            <div className="border-t border-[var(--border)]">
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--orange)] hover:bg-white/[0.04] transition-colors"
              >
                <Plus size={14} />
                Ajouter un compte
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CompteModal
        key={editingCompte?.id ?? "new"}
        open={compteModalOpen}
        onOpenChange={setCompteModalOpen}
        compte={editingCompte}
      />
    </div>
  );
}
