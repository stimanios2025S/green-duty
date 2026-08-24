"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Package,
  Sprout,
  Globe,
  LogOut,
} from "lucide-react";
import type { LangCode } from "@/lib/farmer-i18n";

const NAV_ITEMS = [
  { key: "dashboard", href: "/farmer", icon: LayoutDashboard },
  { key: "ledger", href: "/farmer/ledger", icon: BookOpen },
  { key: "inventory", href: "/farmer/inventory", icon: Package },
  { key: "crops", href: "/farmer/crops", icon: Sprout },
] as const;

const LABELS: Record<LangCode, Record<string, string>> = {
  fr: { dashboard: "Tableau de bord", ledger: "Grand Livre", inventory: "Inventaire", crops: "Parcelles", lang: "FR", nextLang: "AR" },
  ar: { dashboard: "لوحة التحكم", ledger: "دفتر الحسابات", inventory: "المخزون", crops: "المحاصيل", lang: "عر", nextLang: "FR" },
};

export default function FarmerNav({ lang, onLangChange }: { lang: LangCode; onLangChange: (l: LangCode) => void }) {
  const pathname = usePathname();
  const labels = LABELS[lang];
  const isAr = lang === "ar";

  return (
    <aside
      className={`fixed inset-y-0 z-40 w-64 flex flex-col transition-transform max-lg:hidden ${isAr ? "right-0 left-auto" : "left-0"}`}
      style={{ background: "#131318", borderRight: isAr ? "none" : "1px solid rgba(255,255,255,0.05)", borderLeft: isAr ? "1px solid rgba(255,255,255,0.05)" : "none" }}
    >
      {/* Header */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(132,204,22,0.2)" }}>
            <Sprout className="w-5 h-5" style={{ color: "#84cc16" }} />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: "#f4f4f5" }}>GreenDuty</h1>
            <p className="text-[10px]" style={{ color: "#71717a" }}>Farmer Portal</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/farmer" ? pathname === "/farmer" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isActive ? "rgba(132,204,22,0.15)" : "transparent",
                color: isActive ? "#84cc16" : "#a1a1aa",
              }}
            >
              <Icon className="w-5 h-5" />
              <span>{labels[item.key]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={() => onLangChange(lang === "fr" ? "ar" : "fr")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full"
          style={{ color: "#a1a1aa" }}
        >
          <Globe className="w-5 h-5" />
          <span>{labels.nextLang}</span>
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm"
          style={{ color: "#a1a1aa" }}
        >
          <LogOut className="w-5 h-5" />
          <span>{isAr ? "الخروج" : "Retour"}</span>
        </Link>
      </div>
    </aside>
  );
}
