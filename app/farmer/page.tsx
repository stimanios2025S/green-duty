"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "./layout";
import { farmerLang } from "@/lib/farmer-i18n";
import {
  TrendingUp, TrendingDown, DollarSign, Package, Sprout,
  AlertTriangle, BarChart3,
} from "lucide-react";

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

  useEffect(() => {
    if (!user) return;
    fetch(`/api/farmer/dashboard?userId=${user.id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [user]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gd-surface rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gd-surface rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const profitColor = data.netProfit >= 0 ? "text-gd-success" : "text-gd-danger";

  const cards = [
    { label: t.netProfit, value: `${data.netProfit.toLocaleString()} ${t.currency}`, icon: DollarSign, color: profitColor, bg: data.netProfit >= 0 ? "bg-gd-success/10" : "bg-gd-danger/10" },
    { label: t.totalIncome, value: `${data.totalIncome.toLocaleString()} ${t.currency}`, icon: TrendingUp, color: "text-gd-success", bg: "bg-gd-success/10" },
    { label: t.totalExpenses, value: `${data.totalExpenses.toLocaleString()} ${t.currency}`, icon: TrendingDown, color: "text-gd-danger", bg: "bg-gd-danger/10" },
    { label: t.roi, value: `${data.roi}%`, icon: BarChart3, color: "text-gd-primary", bg: "bg-gd-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gd-text-primary">{t.dashboard}</h1>
        <p className="text-sm text-gd-text-muted">{t.welcome}, {user?.name || "—"}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="rounded-xl border border-gd-border bg-gd-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
              <p className="text-[10px] text-gd-text-muted mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gd-border bg-gd-card p-3 text-center">
          <Sprout className="w-5 h-5 text-gd-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-gd-text-primary">{data.activeCropCount}</p>
          <p className="text-[10px] text-gd-text-muted">{lang === "ar" ? "محصول نشط" : "Parcelles actives"}</p>
        </div>
        <div className="rounded-xl border border-gd-border bg-gd-card p-3 text-center">
          <DollarSign className="w-5 h-5 text-gd-warning mx-auto mb-1" />
          <p className="text-lg font-bold text-gd-text-primary">{data.unpaidDebts.count}</p>
          <p className="text-[10px] text-gd-text-muted">{lang === "ar" ? "دين معلق" : "Dettes en attente"}</p>
        </div>
        <div className="rounded-xl border border-gd-border bg-gd-card p-3 text-center">
          <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${data.lowStockItems.length > 0 ? "text-gd-danger" : "text-gd-text-muted"}`} />
          <p className="text-lg font-bold text-gd-text-primary">{data.lowStockItems.length}</p>
          <p className="text-[10px] text-gd-text-muted">{t.lowStockAlerts}</p>
        </div>
      </div>

      {/* Low stock alerts */}
      {data.lowStockItems.length > 0 && (
        <div className="rounded-xl border border-gd-danger/30 bg-gd-danger/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-gd-danger" />
            <span className="text-sm font-medium text-gd-danger">{t.lowStockAlerts}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.lowStockItems.map((item) => (
              <span key={item.id} className="text-xs bg-gd-danger/20 text-gd-danger px-2 py-1 rounded-lg">
                {item.name}: {item.quantity} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Monthly P&L bar chart */}
      {data.monthlyPnl.length > 0 && (
        <div className="rounded-xl border border-gd-border bg-gd-card p-4">
          <h2 className="text-sm font-semibold text-gd-text-primary mb-4">{t.seasonalPnl}</h2>
          <div className="space-y-2">
            {data.monthlyPnl.map((m) => {
              const max = Math.max(m.income, m.expenses, 1);
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-gd-text-muted w-16 flex-shrink-0">{m.month}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-gd-success/60 rounded-full" style={{ width: `${(m.income / max) * 100}%`, minWidth: 4 }} />
                      <span className="text-[10px] text-gd-success">{m.income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-gd-danger/60 rounded-full" style={{ width: `${(m.expenses / max) * 100}%`, minWidth: 4 }} />
                      <span className="text-[10px] text-gd-danger">{m.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            <span className="text-[10px] text-gd-text-muted flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gd-success/60" /> {t.income}</span>
            <span className="text-[10px] text-gd-text-muted flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gd-danger/60" /> {t.expense}</span>
          </div>
        </div>
      )}

      {/* Recent harvests */}
      {data.recentHarvests.length > 0 && (
        <div className="rounded-xl border border-gd-border bg-gd-card p-4">
          <h2 className="text-sm font-semibold text-gd-text-primary mb-3">{t.recentHarvests}</h2>
          <div className="space-y-2">
            {data.recentHarvests.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between bg-gd-surface/50 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gd-text-primary">{h.batch_name || h.crop_type || "—"}</p>
                  <p className="text-[10px] text-gd-text-muted">{h.date} · {h.sold_to || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gd-success">{h.revenue?.toLocaleString()} {t.currency}</p>
                  <p className="text-[10px] text-gd-text-muted">{h.yield_kg} kg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
