"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Check, Plus, Pencil, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import CompteModal from "./CompteModal";
import { CompteIcon } from "@/components/AccountSwitcher";
import { updateSoldeInitial } from "./actions";
import { deleteCompte } from "@/app/comptes/actions";
import { formatEur } from "@/lib/format";
import type { TCompte } from "@/types";

interface IParametresContentProps {
  soldeInitial: number;
  comptes: TCompte[];
  activeCompteId: string;
}

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ParametresContent({
  soldeInitial,
  comptes,
  activeCompteId,
}: IParametresContentProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(String(soldeInitial));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Comptes management
  const [compteModalOpen, setCompteModalOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<TCompte | undefined>();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const activeCompte = comptes.find((c) => c.id === activeCompteId);

  function handleSubmitSolde(e: React.FormEvent) {
    e.preventDefault();

    const montant = parseFloat(inputValue.replace(",", "."));
    if (isNaN(montant)) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    startTransition(async () => {
      const result = await updateSoldeInitial(montant);
      if (result.success) {
        setSaved(true);
        toast.success("Solde initial enregistré");
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour");
      }
    });
  }

  function openAddCompte() {
    setEditingCompte(undefined);
    setCompteModalOpen(true);
  }

  function openEditCompte(compte: TCompte) {
    setEditingCompte(compte);
    setCompteModalOpen(true);
  }

  async function handleDeleteCompte(id: string) {
    const result = await deleteCompte(id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Compte supprimé");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 lg:px-8 lg:py-8">
      {/* ── Header ── */}
      <motion.header
        className="mb-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs text-white/35 uppercase tracking-widest font-medium mb-1">
          Configuration
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      </motion.header>

      <div className="space-y-6 max-w-2xl">
        {/* ── Solde initial du compte actif ── */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Wallet size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Solde initial
                    {activeCompte && (
                      <span className="text-white/40 font-normal ml-1">
                        — {activeCompte.nom}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Montant de départ avant toute transaction
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitSolde} className="space-y-4">
                <div>
                  <label
                    htmlFor="solde-initial"
                    className="block text-xs text-white/40 uppercase tracking-widest mb-2"
                  >
                    Montant (€)
                  </label>
                  <div className="relative">
                    <input
                      id="solde-initial"
                      type="number"
                      step="0.01"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold outline-none focus:border-orange-500/50 transition-colors pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium pointer-events-none">
                      €
                    </span>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saved ? (
                    <>
                      <Check size={16} />
                      Enregistré
                    </>
                  ) : isPending ? (
                    "Enregistrement…"
                  ) : (
                    "Enregistrer le solde initial"
                  )}
                </motion.button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Gestion des comptes ── */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Landmark size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Comptes bancaires
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Gérer vos comptes et soldes initiaux
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddCompte}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  Ajouter
                </motion.button>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {comptes.map((compte) => {
                    const isActive = compte.id === activeCompteId;
                    return (
                      <motion.div
                        key={compte.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          isActive
                            ? "bg-white/[0.06] ring-1 ring-orange-500/30"
                            : "bg-white/[0.03] hover:bg-white/[0.05]"
                        }`}
                      >
                        <span
                          className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                          style={{
                            backgroundColor: `${compte.couleur}20`,
                            color: compte.couleur,
                          }}
                        >
                          <CompteIcon icone={compte.icone} size={17} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {compte.nom}
                            {isActive && (
                              <span className="ml-2 text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                                Actif
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-white/40">
                            Solde initial : {formatEur(compte.solde_initial)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditCompte(compte)}
                            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <ConfirmDeleteButton
                            isConfirming={confirmingDeleteId === compte.id}
                            onDeleteRequest={() => setConfirmingDeleteId(compte.id)}
                            onDeleteConfirm={() => {
                              setConfirmingDeleteId(null);
                              handleDeleteCompte(compte.id);
                            }}
                            onDeleteCancel={() => setConfirmingDeleteId(null)}
                            size={14}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {comptes.length === 0 && (
                  <p className="text-sm text-white/30 text-center py-6">
                    Aucun compte configuré
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Modal Compte ── */}
      <CompteModal
        key={editingCompte?.id ?? "new"}
        open={compteModalOpen}
        onOpenChange={setCompteModalOpen}
        compte={editingCompte}
      />
    </div>
  );
}
