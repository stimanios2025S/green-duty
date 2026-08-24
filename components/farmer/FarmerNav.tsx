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
import { useState } from "react";
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
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gd-card border-r border-gd-border flex flex-col transition-transform max-lg:hidden ${isAr ? "right-0 left-auto border-r-0 border-l" : ""}`}>
      {/* Header */}
      <div className="px-4 py-5 border-b border-gd-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gd-primary/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-gd-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gd-text-primary">GreenDuty</h1>
            <p className="text-[10px] text-gd-text-muted">Farmer Portal</p>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gd-primary/15 text-gd-primary"
                  : "text-gd-text-secondary hover:bg-gd-surface hover:text-gd-text-primary"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{labels[item.key]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gd-border space-y-1">
        <button
          onClick={() => onLangChange(lang === "fr" ? "ar" : "fr")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gd-text-secondary hover:bg-gd-surface w-full"
        >
          <Globe className="w-4.5 h-4.5" />
          <span>{labels.nextLang}</span>
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gd-text-secondary hover:bg-gd-surface"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>{isAr ? "الخروج" : "Retour"}</span>
        </Link>
      </div>
    </aside>
  );
}
