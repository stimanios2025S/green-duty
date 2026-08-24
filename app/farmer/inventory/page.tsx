"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "../layout";
import { farmerLang } from "@/lib/farmer-i18n";
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, X, Trash2, Filter } from "lucide-react";

const C = {
  card: "#131318", surface: "#1e1e27", border: "rgba(255,255,255,0.05)",
  primary: "#84cc16", success: "#22c55e", danger: "#ef4444",
  text: "#f4f4f5", textSec: "#a1a1aa", textMuted: "#71717a",
};

interface InventoryItem { id: string; name: string; category: string; quantity: number; unit: string; low_threshold: number; created_at: string; }

const CATS = ["fertilizer", "pesticide", "seed", "fuel", "equipment"] as const;
const UNITS = ["kg", "quintal", "liter", "bag", "sack", "unit"] as const;

export default function InventoryPage() {
  const { user } = useAuth();
  const { lang } = useFarmerLang();
  const t = farmerLang[lang];
  const uid = user?.id || "";
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [txItem, setTxItem] = useState<InventoryItem | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txReason, setTxReason] = useState("");
  const [form, setForm] = useState({ name: "", category: "fertilizer", quantity: "", unit: "kg", low_threshold: "10" });

  useEffect(() => { if (uid) loadItems(); }, [uid]);

  async function loadItems() {
    const res = await fetch(`/api/farmer/inventory?userId=${uid}`);
    if (res.ok) setItems(await res.json());
  }
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/farmer/inventory?userId=${uid}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity) || 0, low_threshold: parseFloat(form.low_threshold) || 0 }),
    });
    setForm({ name: "", category: "fertilizer", quantity: "", unit: "kg", low_threshold: "10" });
    setShowForm(false); loadItems();
  }
  async function handleTransaction(type: "add" | "remove") {
    if (!txItem || !txAmount) return;
    const delta = type === "add" ? Math.abs(parseFloat(txAmount)) : -Math.abs(parseFloat(txAmount));
    await fetch(`/api/farmer/inventory/${txItem.id}?userId=${uid}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, reason: txReason }),
    });
    setTxItem(null); setTxAmount(""); setTxReason(""); loadItems();
  }
  async function handleDelete(id: string) {
    await fetch(`/api/farmer/inventory/${id}?userId=${uid}`, { method: "DELETE" }); loadItems();
  }

  const filtered = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);
  const lowStockItems = items.filter((i) => i.quantity <= i.low_threshold);
  const catLabel = (cat: string) => {
    const map: Record<string, string> = { fertilizer: t.fertilizer_inv, pesticide: t.pesticide_inv, seed: t.seed_inv, fuel: t.fuel_inv, equipment: t.equipment_inv };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: C.text }}>{t.inventory}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>
          <Plus className="w-4 h-4" /> {t.addItem}
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="rounded-xl p-4" style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: C.danger }} />
            <span className="text-sm font-medium" style={{ color: C.danger }}>{t.lowStockAlerts} ({lowStockItems.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item.id} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.2)", color: C.danger }}>
                {item.name}: {item.quantity} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 flex-shrink-0" style={{ color: C.textMuted }} />
        <button onClick={() => setFilterCat("all")} className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
          style={{ background: filterCat === "all" ? C.primary : C.surface, color: filterCat === "all" ? "#060608" : C.textSec }}>
          {lang === "ar" ? "الكل" : "Tout"}
        </button>
        {CATS.map((cat) => (
          <button key={cat} onClick={() => setFilterCat(cat)} className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
            style={{ background: filterCat === cat ? C.primary : C.surface, color: filterCat === cat ? "#060608" : C.textSec }}>
            {catLabel(cat)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isLow = item.quantity <= item.low_threshold;
          return (
            <div key={item.id} className="rounded-xl p-4"
              style={{ border: `1px solid ${isLow ? "rgba(239,68,68,0.4)" : C.border}`, background: isLow ? "rgba(239,68,68,0.05)" : C.card }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: C.text }}>{item.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.surface, color: C.textMuted }}>{catLabel(item.category)}</span>
                </div>
                <button onClick={() => handleDelete(item.id)} style={{ color: C.textMuted }} className="hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <span className="text-2xl font-bold" style={{ color: isLow ? C.danger : C.text }}>{item.quantity}</span>
                  <span className="text-xs ml-1" style={{ color: C.textMuted }}>{item.unit}</span>
                </div>
                <button onClick={() => { setTxItem(item); setTxAmount(""); setTxReason(""); }}
                  className="p-1.5 rounded-lg" style={{ background: C.surface }}>
                  <Plus className="w-3.5 h-3.5" style={{ color: C.primary }} />
                </button>
              </div>
              <div className="mt-2 w-full rounded-full h-1.5" style={{ background: C.surface }}>
                <div className="h-1.5 rounded-full" style={{ background: isLow ? C.danger : C.primary, width: `${Math.min(100, (item.quantity / (item.low_threshold * 3)) * 100)}%` }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: C.textMuted }}>{t.lowThreshold}: {item.low_threshold} {item.unit}</p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: C.textMuted }}>
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t.noData}</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.card, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: C.text }}>{t.addItem}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: C.textMuted }} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input placeholder={`${t.description}*`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} required />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                {CATS.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="any" placeholder={t.amount} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                  {UNITS.map((u) => <option key={u} value={u}>{t[u === "unit" ? "unit_item" : u] || u}</option>)}
                </select>
              </div>
              <input type="number" step="any" placeholder={t.lowThreshold} value={form.low_threshold} onChange={(e) => setForm({ ...form, low_threshold: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: C.surface, color: C.textSec }}>{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {txItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setTxItem(null)}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1" style={{ color: C.text }}>{txItem.name}</h2>
            <p className="text-xs mb-4" style={{ color: C.textMuted }}>{t.stock}: {txItem.quantity} {txItem.unit}</p>
            <input type="number" step="any" placeholder={t.amount} value={txAmount} onChange={(e) => setTxAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-3" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
            <input placeholder={t.description} value={txReason} onChange={(e) => setTxReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-4" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
            <div className="flex gap-3">
              <button onClick={() => handleTransaction("add")} className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                style={{ background: "rgba(34,197,94,0.2)", color: C.success }}>
                <TrendingUp className="w-4 h-4" /> {t.addStock}
              </button>
              <button onClick={() => handleTransaction("remove")} className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                style={{ background: "rgba(239,68,68,0.2)", color: C.danger }}>
                <TrendingDown className="w-4 h-4" /> {t.removeStock}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
