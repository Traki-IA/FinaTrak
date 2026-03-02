"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Landmark, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import CompteModal from "./CompteModal";
import DeleteAccountDialog from "./DeleteAccountDialog";
import { CompteIcon } from "@/components/AccountSwitcher";
import { deleteCompte } from "@/app/(main)/comptes/actions";
import { formatEur } from "@/lib/format";
import type { TCompte } from "@/types";

interface IParametresContentProps {
  comptes: TCompte[];
  activeCompteId: string;
  userEmail: string;
}

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ParametresContent({
  comptes,
  activeCompteId,
  userEmail,
}: IParametresContentProps) {
  const router = useRouter();

  // Comptes management
  const [compteModalOpen, setCompteModalOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<TCompte | undefined>();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        {/* ── Gestion des comptes ── */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35 }}
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

        {/* ── Zone de danger ── */}
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card className="border-red-500/20">
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-400">
                    Zone de danger
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Actions irréversibles sur votre compte
                  </p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Supprimer mon compte
                  </p>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    Supprime définitivement votre compte et toutes vos
                    données. Cette action est irréversible.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                >
                  Supprimer
                </motion.button>
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

      {/* ── Dialog Suppression de compte ── */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={userEmail}
      />
    </div>
  );
}
