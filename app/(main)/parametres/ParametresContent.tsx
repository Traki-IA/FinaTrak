"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Shell from "@/components/layout/Shell";
import CategoryList from "@/components/CategoryList";
import DeleteAccountDialog from "./DeleteAccountDialog";
import type { TCategorie } from "@/types";

interface IParametresContentProps {
  userEmail: string;
  userDisplayName: string;
  categories: TCategorie[];
}

// ── Paramètres (Pulse Flat) ────────────────────────────────────────────────────

function Parametres({
  userEmail,
  userDisplayName,
  categories,
  onDeleteOpen,
}: IParametresContentProps & { onDeleteOpen: () => void }) {
  return (
    <Shell>
      {/* Header */}
      <div className="mb-4">
        <p className="text-[11px] text-white/55 uppercase tracking-widest font-medium mb-1">
          Configuration
        </p>
        <h1 className="text-[22px] font-black tracking-tight">Paramètres</h1>
      </div>

      {/* Compte section — flat */}
      <div className="border-b border-white/[0.05] pb-4 mb-4">
        <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold mb-3">Compte</p>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          <div>
            <p className="text-[14px] font-[600] text-white leading-none">{userDisplayName}</p>
            <span className="text-[12px] text-white/50 mt-0.5 block">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* Catégories section — flat */}
      <div className="border-b border-white/[0.05] pb-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
          <p className="text-[14px] font-[600] text-white">Catégories</p>
        </div>
        <p className="text-[12px] text-white/50 mb-3">
          Personnalisez vos catégories de dépenses et revenus
        </p>
        <CategoryList categories={categories} />
      </div>

      {/* Zone de danger — flat */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <p className="text-[14px] font-[600] text-red-400">Zone de danger</p>
        </div>
        <div className="border-b border-white/[0.05] pb-4">
          <p className="text-[14px] font-[600] text-white mb-0.5">Supprimer mon compte</p>
          <p className="text-[12px] text-white/50 mb-3 leading-relaxed">
            Supprime définitivement votre compte et toutes vos données. Cette action est irréversible.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDeleteOpen}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
            <AlertTriangle size={12} />
            Supprimer
          </motion.button>
        </div>
      </div>
    </Shell>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ParametresContent({
  userEmail,
  userDisplayName,
  categories,
}: IParametresContentProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <Parametres
        userEmail={userEmail}
        userDisplayName={userDisplayName}
        categories={categories}
        onDeleteOpen={() => setDeleteDialogOpen(true)}
      />

      {/* Dialog — rendered once */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={userEmail}
      />
    </>
  );
}
