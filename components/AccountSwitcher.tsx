"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import CompteModal from "@/components/CompteModal";
import { CompteIcon, ICON_MAP } from "@/components/compte-icons";
import { deleteCompte } from "@/app/(main)/comptes/actions";
import type { TCompte } from "@/types";

interface IAccountSwitcherProps {
  comptes: TCompte[];
  activeCompteId: string;
  collapsed?: boolean;
}

export default function AccountSwitcher({ comptes, activeCompteId, collapsed }: IAccountSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [compteModalOpen, setCompteModalOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<TCompte | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  const activeCompte = comptes.find((c) => c.id === activeCompteId) ?? comptes[0];

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

  async function handleSwitch(compteId: string) {
    if (compteId === activeCompteId) {
      setOpen(false);
      return;
    }

    setSwitching(true);

    try {
      const res = await fetch("/api/switch-compte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compteId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors du changement de compte");
        setSwitching(false);
        setOpen(false);
      } else {
        setOpen(false);
        window.location.reload();
      }
    } catch {
      toast.error("Erreur lors du changement de compte");
      setSwitching(false);
      setOpen(false);
    }
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
      router.refresh();
    }
  }

  if (!activeCompte) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bouton trigger */}
      {collapsed ? (
        <button
          onClick={() => setOpen((prev) => !prev)}
          disabled={switching}
          className="flex items-center justify-center w-full p-2 rounded-xl hover:bg-white/[0.05] transition-all"
          title={activeCompte.nom}
        >
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${activeCompte.couleur}20`, color: activeCompte.couleur }}
          >
            <CompteIcon icone={activeCompte.icone} size={16} strokeWidth={2} />
          </span>
        </button>
      ) : (
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
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute bg-[#111122] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50 ${
              collapsed
                ? "left-full ml-2 top-0 w-56"
                : "left-0 right-0 top-full mt-1"
            }`}
          >
            {/* Liste des comptes */}
            {comptes.map((compte) => {
              const isActive = compte.id === activeCompte?.id;
              const isConfirming = confirmingDeleteId === compte.id;
              return (
                <div
                  key={compte.id}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors group ${
                    isActive
                      ? "bg-white/[0.05] text-white"
                      : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Zone cliquable pour switcher */}
                  <button
                    onClick={() => handleSwitch(compte.id)}
                    disabled={switching}
                    className="flex items-center gap-2.5 flex-1 min-w-0"
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

                  {/* Actions edit/delete */}
                  <div className={`flex items-center gap-0.5 flex-shrink-0 ${isConfirming ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                    {!isConfirming && (
                      <button
                        onClick={(e) => openEditModal(compte, e)}
                        className="p-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.07] transition-colors"
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

            {/* Séparateur + Ajouter */}
            <div className="border-t border-white/[0.06]">
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-white/[0.04] transition-colors"
              >
                <Plus size={14} />
                Ajouter un compte
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Compte */}
      <CompteModal
        key={editingCompte?.id ?? "new"}
        open={compteModalOpen}
        onOpenChange={setCompteModalOpen}
        compte={editingCompte}
      />
    </div>
  );
}

export { CompteIcon, ICON_MAP };
