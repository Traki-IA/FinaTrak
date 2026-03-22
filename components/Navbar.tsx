"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  Target,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard", label: "Tableau", icon: LayoutDashboard },
  { key: "transactions", href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { key: "budget", href: "/budget", label: "Budget", icon: Receipt },
  { key: "objectifs", href: "/objectifs", label: "Objectifs", icon: Target },
  { key: "parametres", href: "/parametres", label: "Paramètres", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur border-t border-[#181818] flex z-30 px-1 pb-[max(8px,env(safe-area-inset-bottom))]">
      {NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={key}
            href={href}
            prefetch={true}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              isActive ? "text-[var(--orange)]" : "text-[var(--text3)]"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
            {label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
