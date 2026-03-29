"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, KeyRound, LogOut, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { updateUserDisplayName, updateUserPassword } from "./actions";
import { signOutAction } from "@/app/auth/actions";

interface IAccountCardProps {
  userEmail: string;
  userDisplayName: string;
}

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function AccountCard({
  userEmail,
  userDisplayName,
}: IAccountCardProps) {
  // Display name state
  const [displayName, setDisplayName] = useState(userDisplayName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function handleSaveName() {
    if (!displayName.trim()) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }

    setIsSavingName(true);
    const result = await updateUserDisplayName(displayName.trim());
    setIsSavingName(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Nom mis à jour");
      setIsEditingName(false);
    }
  }

  async function handleSavePassword() {
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSavingPassword(true);
    const result = await updateUserPassword(currentPassword, newPassword);
    setIsSavingPassword(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Mot de passe modifié");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    }
  }

  return (
    <motion.div
      variants={FADE_UP}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.35 }}
    >
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <User size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                Gestion du compte
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Email, nom d&apos;utilisateur et mot de passe
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* ── Email (lecture seule) ── */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.05] text-white/40 flex-shrink-0">
                <Mail size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/35 uppercase tracking-widest font-medium">
                  Email
                </p>
                <p className="text-sm text-white truncate">{userEmail}</p>
              </div>
            </div>

            {/* ── Nom d'utilisateur ── */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.05] text-white/40 flex-shrink-0">
                <User size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/35 uppercase tracking-widest font-medium">
                  Nom d&apos;utilisateur
                </p>
                {isEditingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") {
                          setDisplayName(userDisplayName);
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
                    >
                      {isSavingName ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-sm text-white hover:text-orange-400 transition-colors text-left"
                  >
                    {userDisplayName || "Non défini"}
                  </button>
                )}
              </div>
            </div>

            {/* ── Mot de passe ── */}
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.05] text-white/40 flex-shrink-0">
                  <KeyRound size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/35 uppercase tracking-widest font-medium">
                    Mot de passe
                  </p>
                  {!isChangingPassword ? (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="text-sm text-white/50 hover:text-orange-400 transition-colors"
                    >
                      Modifier le mot de passe
                    </button>
                  ) : (
                    <p className="text-sm text-white/50">
                      Nouveau mot de passe
                    </p>
                  )}
                </div>
              </div>

              {isChangingPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 ml-12 space-y-3"
                >
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                    placeholder="Mot de passe actuel"
                    autoFocus
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                    placeholder="Nouveau mot de passe (8 caractères min.)"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                    placeholder="Confirmer le nouveau mot de passe"
                  />
                  {passwordError && (
                    <p className="text-red-400 text-xs">{passwordError}</p>
                  )}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSavePassword}
                      disabled={isSavingPassword}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {isSavingPassword ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Enregistrer"
                      )}
                    </motion.button>
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError("");
                      }}
                      className="px-3 py-2 rounded-lg text-white/40 hover:text-white text-xs transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Déconnexion ── */}
          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <form action={signOutAction}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <LogOut size={16} strokeWidth={1.7} />
                Se déconnecter
              </motion.button>
            </form>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
