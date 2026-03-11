"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import AccountSwitcher from "@/components/AccountSwitcher";
import NavList, { ALL_NAV_ITEMS } from "@/components/NavList";
import { useSidebar, SIDEBAR_WIDTH_ICONIC } from "@/components/SidebarContext";
import type { TCompte } from "@/types";

interface INavbarProps {
  comptes: TCompte[];
  activeCompteId: string;
  navOrder: string[];
  solde?: number;
  userName?: string;
  userEmail?: string;
}

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function Navbar({
  comptes,
  activeCompteId,
  navOrder,
  solde,
  userName,
  userEmail,
}: INavbarProps) {
  const pathname = usePathname();
  const { toggle, breakpoint, isIconic, sidebarWidth } = useSidebar();

  const showToggle = breakpoint === "desktop";
  const userInitial = (userName ?? userEmail ?? "U")[0].toUpperCase();

  return (
    <>
      {/* ── Sidebar tablet + desktop (md+) ── */}
      <motion.aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-[#07070f] border-r border-white/[0.06] flex-col z-30 overflow-hidden"
        animate={{ width: sidebarWidth || SIDEBAR_WIDTH_ICONIC }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Logo + date */}
        <div
          className={`pb-5 border-b border-white/[0.06] ${
            isIconic ? "pt-4 px-0 flex justify-center" : "pt-5 px-[18px]"
          }`}
        >
          {isIconic ? (
            <span className="text-orange-500 font-bold text-[13px]">F</span>
          ) : (
            <>
              <span className="text-white font-[900] text-lg tracking-tight whitespace-nowrap">
                Fina<span className="text-orange-500">Trak</span>
              </span>
              <p className="text-[10px] text-white/28 mt-0.5">
                {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </p>
            </>
          )}
        </div>

        {/* Solde rapide (desktop expanded only) */}
        {!isIconic && solde !== undefined && (
          <div className="px-[18px] py-3.5 border-b border-white/[0.06]">
            <p className="text-[9px] text-white/28 uppercase tracking-[0.14em] font-semibold">
              Solde
            </p>
            <p className="text-[22px] font-[900] tracking-tight mt-1 leading-none">
              {formatEur(solde)}{" "}
              <span className="text-[12px] text-white/28 font-light">€</span>
            </p>
            <p className="text-[10px] text-emerald-400 font-bold mt-1">↑ ce mois</p>
          </div>
        )}

        {/* Account Switcher */}
        {comptes.length > 0 && (
          <div className={`my-3 ${isIconic ? "px-1.5" : "px-3"}`}>
            <AccountSwitcher
              comptes={comptes}
              activeCompteId={activeCompteId}
              collapsed={isIconic}
            />
          </div>
        )}

        {/* Nav links (drag-and-drop) */}
        <nav className={`flex-1 overflow-y-auto ${isIconic ? "px-1.5" : "px-2.5"}`}>
          <NavList savedOrder={navOrder} collapsed={isIconic} />
        </nav>

        {/* Toggle collapse/expand (desktop only) */}
        {showToggle && (
          <div className={`py-2 ${isIconic ? "px-1.5" : "px-3"}`}>
            <button
              onClick={toggle}
              className="w-full flex items-center justify-center p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
              title={isIconic ? "Développer la sidebar" : "Réduire la sidebar"}
            >
              {isIconic ? (
                <ChevronsRight size={16} />
              ) : (
                <ChevronsLeft size={16} />
              )}
            </button>
          </div>
        )}

        {/* User footer */}
        <div
          className={`py-3 border-t border-white/[0.06] ${
            isIconic ? "px-1.5 flex justify-center" : "px-[18px]"
          }`}
        >
          {isIconic ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-[900] shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316, #6366f1)" }}
            >
              {userInitial}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-[900] shrink-0"
                style={{ background: "linear-gradient(135deg, #f97316, #6366f1)" }}
              >
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-none truncate">
                  {userName ?? "Utilisateur"}
                </p>
                {userEmail && (
                  <p className="text-[9px] text-white/28 mt-0.5 truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ── Bottom bar mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#07070f]/95 backdrop-blur border-t border-white/[0.07] flex z-30 px-1 pb-[max(8px,env(safe-area-inset-bottom))]">
        {ALL_NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? "text-orange-400" : "text-white/35"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
              {label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
