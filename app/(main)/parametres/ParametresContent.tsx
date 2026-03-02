"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

export default function ParametresContent({
  userEmail,
  userDisplayName,
  categories,
}: IParametresContentProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        {/* ── Gestion du compte ── */}
        <AccountCard
          userEmail={userEmail}
          userDisplayName={userDisplayName}
        />

        {/* ── Catégories ── */}
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

      {/* ── Dialog Suppression de compte ── */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={userEmail}
      />
    </div>
  );
}
