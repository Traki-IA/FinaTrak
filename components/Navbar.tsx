"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountSwitcher from "@/components/AccountSwitcher";
import NavList, { ALL_NAV_ITEMS } from "@/components/NavList";
import type { TCompte } from "@/types";

interface INavbarProps {
  comptes: TCompte[];
  activeCompteId: string;
  navOrder: string[];
}

export default function Navbar({ comptes, activeCompteId, navOrder }: INavbarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Sidebar desktop (md+) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-[#07070f] border-r border-white/[0.06] flex-col z-30">
        {/* Logo */}
        <div className="px-5 pt-7 pb-6">
          <span className="text-white font-bold text-xl tracking-tight">
            Fina<span className="text-orange-500">Trak</span>
          </span>
        </div>

        {/* Account Switcher */}
        {comptes.length > 0 && (
          <div className="px-3 mb-4">
            <AccountSwitcher comptes={comptes} activeCompteId={activeCompteId} />
          </div>
        )}

        {/* Nav links (drag-and-drop) */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <NavList savedOrder={navOrder} />
        </nav>

        {/* Footer */}
        <div className="px-5 py-5 border-t border-white/[0.05]">
          <p className="text-[11px] text-white/20">FinaTrak · v0.2</p>
        </div>
      </aside>

      {/* ── Bottom bar mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#07070f]/95 backdrop-blur border-t border-white/[0.07] flex z-30 pb-safe">
        {ALL_NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-orange-400" : "text-white/35"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
              {label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
