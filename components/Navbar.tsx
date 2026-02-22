"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Target,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/bilan", label: "Bilan", icon: BarChart3 },
  { href: "/objectifs", label: "Objectifs", icon: Target },
];

export default function Navbar() {
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

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-white/40 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-5 border-t border-white/[0.05]">
          <p className="text-[11px] text-white/20">FinaTrak · v0.1</p>
        </div>
      </aside>

      {/* ── Bottom bar mobile ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#07070f]/95 backdrop-blur border-t border-white/[0.07] flex z-30 pb-safe">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
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
