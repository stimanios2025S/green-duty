"use client";

import { useState, createContext, useContext } from "react";
import FarmerNav from "@/components/farmer/FarmerNav";
import type { LangCode } from "@/lib/farmer-i18n";
import { Menu, X } from "lucide-react";

export const FarmerLangContext = createContext<{ lang: LangCode; setLang: (l: LangCode) => void }>({
  lang: "fr",
  setLang: () => {},
});

export function useFarmerLang() {
  return useContext(FarmerLangContext);
}

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>("fr");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <FarmerLangContext.Provider value={{ lang, setLang }}>
      <div className={`min-h-screen bg-gd-deepest ${lang === "ar" ? "rtl" : "ltr"}`}>
        <FarmerNav lang={lang} onLangChange={setLang} />

        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-gd-card border-b border-gd-border px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gd-text-primary">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-bold text-gd-primary">GreenDuty Farmer</span>
          <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="text-xs text-gd-text-muted bg-gd-surface px-2 py-1 rounded-lg">
            {lang === "fr" ? "عر" : "FR"}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
            <div className="w-64 h-full bg-gd-card p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
              {["Dashboard", "Ledger", "Inventory", "Crops"].map((item) => (
                <a
                  key={item}
                  href={`/farmer/${item.toLowerCase() === "dashboard" ? "" : item.toLowerCase()}`}
                  className="block px-3 py-2 rounded-xl text-sm text-gd-text-secondary hover:bg-gd-surface"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}

        <main className={`lg:ml-64 pt-14 lg:pt-0 min-h-screen ${lang === "ar" ? "lg:ml-0 lg:mr-64" : ""}`}>
          <div className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </FarmerLangContext.Provider>
  );
}
