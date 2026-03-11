"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Shell from "@/components/layout/Shell";
import AccountCard from "./AccountCard";
import CategoryList from "@/components/CategoryList";
import DeleteAccountDialog from "./DeleteAccountDialog";
import type { TCategorie } from "@/types";

interface IParametresContentProps {
  userEmail: string;
  userDisplayName: string;
  categories: TCategorie[];
}

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

// ── Desktop Parametres ────────────────────────────────────────────────────────

function DesktopParametres({
  userEmail,
  userDisplayName,
  categories,
  onDeleteOpen,
}: IParametresContentProps & { onDeleteOpen: () => void }) {
  return (
    <Shell>
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
        <AccountCard userEmail={userEmail} userDisplayName={userDisplayName} />

        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                  <Palette size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Catégories</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Personnalisez vos catégories de dépenses et revenus
                  </p>
                </div>
              </div>
              <CategoryList categories={categories} />
            </CardContent>
          </Card>
        </motion.div>

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
                  <p className="text-sm font-semibold text-red-400">Zone de danger</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Actions irréversibles sur votre compte
                  </p>
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Supprimer mon compte</p>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    Supprime définitivement votre compte et toutes vos données. Cette action est irréversible.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDeleteOpen}
                  className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                >
                  Supprimer
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Shell>
  );
}

// ── Mobile Parametres (Pulse Flat) ────────────────────────────────────────────

function MobileParametres({
  userEmail,
  userDisplayName,
  categories,
  onDeleteOpen,
}: IParametresContentProps & { onDeleteOpen: () => void }) {
  return (
    <Shell>
      {/* Header */}
      <div className="mb-4">
        <p className="text-[9px] text-white/55 uppercase tracking-widest font-medium mb-1">
          Configuration
        </p>
        <h1 className="text-[22px] font-black tracking-tight">Paramètres</h1>
      </div>

      {/* Compte section — flat */}
      <div className="border-b border-white/[0.05] pb-4 mb-4">
        <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold mb-3">Compte</p>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          <div>
            <p className="text-[13px] font-[600] text-white leading-none">{userDisplayName}</p>
            <span className="text-[10px] text-white/50 mt-0.5 block">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* Catégories section — flat */}
      <div className="border-b border-white/[0.05] pb-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
          <p className="text-[13px] font-[600] text-white">Catégories</p>
        </div>
        <p className="text-[10px] text-white/50 mb-3">
          Personnalisez vos catégories de dépenses et revenus
        </p>
        <CategoryList categories={categories} />
      </div>

      {/* Zone de danger — flat */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <p className="text-[13px] font-[600] text-red-400">Zone de danger</p>
        </div>
        <div className="border-b border-white/[0.05] pb-4">
          <p className="text-[13px] font-[600] text-white mb-0.5">Supprimer mon compte</p>
          <p className="text-[10px] text-white/50 mb-3 leading-relaxed">
            Supprime définitivement votre compte et toutes vos données. Cette action est irréversible.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDeleteOpen}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
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
      <div className="md:hidden">
        <MobileParametres
          userEmail={userEmail}
          userDisplayName={userDisplayName}
          categories={categories}
          onDeleteOpen={() => setDeleteDialogOpen(true)}
        />
      </div>
      <div className="hidden md:block">
        <DesktopParametres
          userEmail={userEmail}
          userDisplayName={userDisplayName}
          categories={categories}
          onDeleteOpen={() => setDeleteDialogOpen(true)}
        />
      </div>

      {/* Dialog — rendered once */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={userEmail}
      />
    </>
  );
}
