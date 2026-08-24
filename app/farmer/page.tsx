"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "./layout";
import { farmerLang } from "@/lib/farmer-i18n";
import {
  TrendingUp, TrendingDown, DollarSign, Sprout,
  AlertTriangle, BarChart3, LogIn,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  roi: number;
  lowStockItems: { id: string; name: string; quantity: number; unit: string }[];
  activeCropCount: number;
  unpaidDebts: { count: number; total: number };
  recentHarvests: any[];
  monthlyPnl: { month: string; income: number; expenses: number }[];
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { lang } = useFarmerLang();
  const t = farmerLang[lang];
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/farmer/dashboard?userId=${user.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load dashboard");
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [user]);

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sprout className="w-16 h-16 mb-4 opacity-30" style={{ color: "#84cc16" }} />
        <h2 className="text-xl font-bold" style={{ color: "#f4f4f5" }}>{t.welcome}</h2>
        <p className="mt-2 text-sm" style={{ color: "#a1a1aa" }}>
          {lang === "ar" ? "سجّل الدخول للوصول إلى بوابة المزارع" : "Sign in to access the Farmer Portal"}
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "#84cc16" }}>
          <LogIn className="w-4 h-4" /> {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
        </Link>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: "#1e1e27" }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "#1e1e27" }} />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 mb-3" style={{ color: "#ef4444" }} />
        <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#84cc16" }}>
          {lang === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  const profitColor = data!.netProfit >= 0 ? "#22c55e" : "#ef4444";

  const cards = [
    { label: t.netProfit, value: `${data!.netProfit.toLocaleString()} ${t.currency}`, icon: DollarSign, color: profitColor, bg: data!.netProfit >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" },
    { label: t.totalIncome, value: `${data!.totalIncome.toLocaleString()} ${t.currency}`, icon: TrendingUp, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    { label: t.totalExpenses, value: `${data!.totalExpenses.toLocaleString()} ${t.currency}`, icon: TrendingDown, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    { label: t.roi, value: `${data!.roi}%`, icon: BarChart3, color: "#84cc16", bg: "rgba(132,204,22,0.1)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#f4f4f5" }}>{t.dashboard}</h1>
        <p className="text-sm" style={{ color: "#a1a1aa" }}>{t.welcome}, {user.name || "—"}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#131318" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#71717a" }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#131318" }}>
          <Sprout className="w-5 h-5 mx-auto mb-1" style={{ color: "#84cc16" }} />
          <p className="text-lg font-bold" style={{ color: "#f4f4f5" }}>{data!.activeCropCount}</p>
          <p className="text-[10px]" style={{ color: "#71717a" }}>{lang === "ar" ? "محصول نشط" : "Parcelles actives"}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#131318" }}>
          <DollarSign className="w-5 h-5 mx-auto mb-1" style={{ color: "#f59e0b" }} />
          <p className="text-lg font-bold" style={{ color: "#f4f4f5" }}>{data!.unpaidDebts.count}</p>
          <p className="text-[10px]" style={{ color: "#71717a" }}>{lang === "ar" ? "دين معلق" : "Dettes en attente"}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#131318" }}>
          <AlertTriangle className="w-5 h-5 mx-auto mb-1" style={{ color: data!.lowStockItems.length > 0 ? "#ef4444" : "#71717a" }} />
          <p className="text-lg font-bold" style={{ color: "#f4f4f5" }}>{data!.lowStockItems.length}</p>
          <p className="text-[10px]" style={{ color: "#71717a" }}>{t.lowStockAlerts}</p>
        </div>
      </div>

      {/* Low stock alerts */}
      {data!.lowStockItems.length > 0 && (
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
            <span className="text-sm font-medium" style={{ color: "#ef4444" }}>{t.lowStockAlerts}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data!.lowStockItems.map((item) => (
              <span key={item.id} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                {item.name}: {item.quantity} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Monthly P&L bar chart */}
      {data!.monthlyPnl.length > 0 && (
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#131318" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#f4f4f5" }}>{t.seasonalPnl}</h2>
          <div className="space-y-2">
            {data!.monthlyPnl.map((m) => {
              const max = Math.max(m.income, m.expenses, 1);
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs w-16 flex-shrink-0" style={{ color: "#71717a" }}>{m.month}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 rounded-full" style={{ background: "rgba(34,197,94,0.6)", width: `${(m.income / max) * 100}%`, minWidth: 4 }} />
                      <span className="text-[10px]" style={{ color: "#22c55e" }}>{m.income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 rounded-full" style={{ background: "rgba(239,68,68,0.6)", width: `${(m.expenses / max) * 100}%`, minWidth: 4 }} />
                      <span className="text-[10px]" style={{ color: "#ef4444" }}>{m.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            <span className="text-[10px] flex items-center gap-1" style={{ color: "#71717a" }}><span className="w-2 h-2 rounded-full" style={{ background: "rgba(34,197,94,0.6)" }} /> {t.income}</span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: "#71717a" }}><span className="w-2 h-2 rounded-full" style={{ background: "rgba(239,68,68,0.6)" }} /> {t.expense}</span>
          </div>
        </div>
      )}

      {/* Recent harvests */}
      {data!.recentHarvests.length > 0 && (
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#131318" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#f4f4f5" }}>{t.recentHarvests}</h2>
          <div className="space-y-2">
            {data!.recentHarvests.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#f4f4f5" }}>{h.batch_name || h.crop_type || "—"}</p>
                  <p className="text-[10px]" style={{ color: "#71717a" }}>{h.date} · {h.sold_to || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: "#22c55e" }}>{h.revenue?.toLocaleString()} {t.currency}</p>
                  <p className="text-[10px]" style={{ color: "#71717a" }}>{h.yield_kg} kg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data!.monthlyPnl.length === 0 && data!.recentHarvests.length === 0 && (
        <div className="text-center py-8 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "#131318" }}>
          <Sprout className="w-12 h-12 mx-auto mb-3" style={{ color: "#84cc16", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "#71717a" }}>{t.noData}</p>
          <p className="text-xs mt-1" style={{ color: "#71717a" }}>
            {lang === "ar" ? "ابدأ بإضافة مدخول أو مصروف من دفتر الحسابات" : "Start by adding income or expenses from the Ledger"}
          </p>
        </div>
      )}
    </div>
  );
}
