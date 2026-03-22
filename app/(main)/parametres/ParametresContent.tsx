"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Key, ShieldCheck, Trash2, Moon, Bell, Fingerprint,
  ShieldAlert, Download, ChevronRight, Loader2, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import Shell from "@/components/layout/Shell";
import LogoHeader from "@/components/ui/LogoHeader";
import DeleteAccountDialog from "./DeleteAccountDialog";
import { updateUserPassword } from "./actions";

// ── Toggle (UI only) ───────────────────────────────────────────────────────────

function Toggle({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <div
      className={`relative inline-flex h-5 w-9 items-center rounded-full flex-shrink-0 ${
        checked ? "bg-orange-500" : "bg-[var(--bg3)] border border-[var(--border)]"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full shadow transition-transform ${
          checked ? "translate-x-[18px] bg-white" : "translate-x-[2px] bg-[var(--text3)]"
        }`}
      />
    </div>
  );
}

// ── Badge "Bientôt" ────────────────────────────────────────────────────────────

function SoonBadge() {
  return (
    <span className="text-[11px] font-semibold text-[var(--text3)] bg-white/[0.05] px-2 py-0.5 rounded-full">
      Bientôt
    </span>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────────

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="mt-[8px] rounded-[14px] overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}
    >
      <div
        className="py-[2px] flex items-center justify-center"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}
      >
        <span className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">{label}</span>
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  );
}

// ── Setting Row ────────────────────────────────────────────────────────────────

function SettingRow({
  icon,
  label,
  subtitle,
  right,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`w-full flex items-center gap-3 px-[14px] py-[11px] text-left transition-colors ${
        onClick && !disabled ? "active:bg-white/[0.03]" : ""
      } ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <div
        className={`w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 ${
          danger ? "bg-red-500/10" : "bg-white/[0.06]"
        }`}
      >
        <span className={danger ? "text-red-400" : "text-[var(--text2)]"}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-[500] leading-none ${danger ? "text-red-400" : "text-[var(--text)]"} ${disabled ? "opacity-50" : ""}`}>
          {label}
        </p>
        {subtitle && (
          <p className={`text-[13px] text-[var(--text3)] mt-[3px] ${disabled ? "opacity-50" : ""}`}>{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </button>
  );
}

// ── Password Form (inline expandable) ─────────────────────────────────────────

function PasswordForm({ onClose }: { onClose: () => void }) {
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error("Les mots de passe ne correspondent pas"); return; }
    startTransition(async () => {
      const result = await updateUserPassword(newPwd);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Mot de passe mis à jour");
      onClose();
    });
  }

  return (
    <motion.form
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="overflow-hidden"
    >
      <div className="px-[14px] pb-[14px] space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="pt-[10px] space-y-2">
          {/* Nouveau mot de passe */}
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Nouveau mot de passe"
              autoFocus
              className="w-full bg-white/[0.05] border border-[var(--border)] rounded-xl px-3 pr-10 py-2 text-[14px] text-[var(--text)] outline-none focus:border-orange-500/60 transition-colors placeholder:text-[var(--text3)]"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)]">
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Confirmer */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full bg-white/[0.05] border border-[var(--border)] rounded-xl px-3 pr-10 py-2 text-[14px] text-[var(--text)] outline-none focus:border-orange-500/60 transition-colors placeholder:text-[var(--text3)]"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)]">
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-[14px] text-[var(--text2)] bg-white/[0.03] hover:bg-white/[0.07] transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending || !newPwd || !confirmPwd}
            className="flex-1 py-2 rounded-xl text-[14px] text-white bg-orange-500 hover:bg-orange-600 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {isPending && <Loader2 size={12} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </motion.form>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface IParametresContentProps {
  userEmail: string;
  userDisplayName: string;
}

export default function ParametresContent({ userEmail, userDisplayName }: IParametresContentProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pwdFormOpen, setPwdFormOpen] = useState(false);

  return (
    <>
      <Shell>
        <LogoHeader />

        {/* COMPTE */}
        <SectionCard label="Compte">
          <SettingRow
            icon={<User size={15} />}
            label={userDisplayName || "Mon compte"}
            subtitle={userEmail}
          />
          <div>
            <SettingRow
              icon={<Key size={15} />}
              label="Modifier le mot de passe"
              subtitle="Changer votre mot de passe"
              right={
                <ChevronRight
                  size={14}
                  className={`text-[var(--text3)] transition-transform duration-200 ${pwdFormOpen ? "rotate-90" : ""}`}
                />
              }
              onClick={() => setPwdFormOpen(!pwdFormOpen)}
            />
            <AnimatePresence>
              {pwdFormOpen && <PasswordForm onClose={() => setPwdFormOpen(false)} />}
            </AnimatePresence>
          </div>
          <SettingRow
            icon={<ShieldCheck size={15} />}
            label="Double authentification"
            subtitle="2FA"
            right={<SoonBadge />}
            disabled
          />
          <SettingRow
            icon={<Trash2 size={15} />}
            label="Supprimer le compte"
            right={<ChevronRight size={14} className="text-red-400/60" />}
            onClick={() => setDeleteDialogOpen(true)}
            danger
          />
        </SectionCard>

        {/* PRÉFÉRENCES */}
        <SectionCard label="Préférences">
          <SettingRow
            icon={<Moon size={15} />}
            label="Mode sombre"
            subtitle="Toujours actif"
            right={<Toggle checked={true} disabled />}
          />
          <SettingRow
            icon={<Bell size={15} />}
            label="Notifications"
            subtitle="Bientôt disponible"
            right={<Toggle checked={false} disabled />}
            disabled
          />
          <SettingRow
            icon={<Fingerprint size={15} />}
            label="Biométrie"
            subtitle="Face ID / Touch ID"
            right={<Toggle checked={false} disabled />}
            disabled
          />
          <SettingRow
            icon={<ShieldAlert size={15} />}
            label="Alertes budget"
            subtitle="Bientôt disponible"
            right={<Toggle checked={false} disabled />}
            disabled
          />
        </SectionCard>

        {/* DONNÉES */}
        <SectionCard label="Données">
          <SettingRow
            icon={<Download size={15} />}
            label="Exporter les données"
            subtitle="CSV, Excel"
            right={<SoonBadge />}
            disabled
          />
        </SectionCard>
      </Shell>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={userEmail}
      />
    </>
  );
}
