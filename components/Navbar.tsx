"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import AccountSwitcher from "@/components/AccountSwitcher";
import NavList, { ALL_NAV_ITEMS } from "@/components/NavList";
import { useSidebar, SIDEBAR_WIDTH_ICONIC, SIDEBAR_WIDTH_FULL } from "@/components/SidebarContext";
import type { TCompte } from "@/types";

interface INavbarProps {
  comptes: TCompte[];
  activeCompteId: string;
  navOrder: string[];
}

export default function Navbar({ comptes, activeCompteId, navOrder }: INavbarProps) {
  const pathname = usePathname();
  const { toggle, breakpoint, isIconic, sidebarWidth } = useSidebar();

  const showToggle = breakpoint === "desktop";

  return (
    <>
      {/* ── Sidebar tablet + desktop (md+) ── */}
      <motion.aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-[#07070f] border-r border-white/[0.06] flex-col z-30 overflow-hidden"
        animate={{ width: sidebarWidth || SIDEBAR_WIDTH_ICONIC }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Logo */}
        <div
          className={`pt-7 pb-6 ${
            isIconic ? "px-0 flex justify-center" : "px-5"
          }`}
        >
          {isIconic ? (
            <span className="text-orange-500 font-bold text-lg">F</span>
          ) : (
            <span className="text-white font-bold text-xl tracking-tight whitespace-nowrap">
              Fina<span className="text-orange-500">Trak</span>
            </span>
          )}
        </div>

        {/* Account Switcher */}
        {comptes.length > 0 && (
          <div className={`mb-4 ${isIconic ? "px-1.5" : "px-3"}`}>
            <AccountSwitcher
              comptes={comptes}
              activeCompteId={activeCompteId}
              collapsed={isIconic}
            />
          </div>
        )}

        {/* Nav links (drag-and-drop) */}
        <nav className={`flex-1 overflow-y-auto ${isIconic ? "px-1.5" : "px-3"}`}>
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

        {/* Footer */}
        <div
          className={`py-4 border-t border-white/[0.05] ${
            isIconic ? "px-1.5" : "px-3"
          }`}
        >
          {!isIconic && (
            <p className="text-[11px] text-white/20 px-2 whitespace-nowrap">
              FinaTrak · v0.2
            </p>
          )}
        </div>
      </motion.aside>

      {/* ── Bottom bar mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#07070f]/95 backdrop-blur border-t border-white/[0.07] flex z-30 pb-safe">
        {ALL_NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
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
