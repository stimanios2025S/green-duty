"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "../layout";
import { farmerLang } from "@/lib/farmer-i18n";
import {
  Plus, Package, AlertTriangle, TrendingDown, TrendingUp,
  X, Trash2, Filter,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  low_threshold: number;
  created_at: string;
}

const CATEGORIES = ["fertilizer", "pesticide", "seed", "fuel", "equipment"] as const;
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

  const [form, setForm] = useState({
    name: "", category: "fertilizer", quantity: "", unit: "kg", low_threshold: "10",
  });

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    const res = await fetch(`/api/farmer/inventory?userId=${uid}`);
    if (res.ok) setItems(await res.json());
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/farmer/inventory?userId=${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity) || 0, low_threshold: parseFloat(form.low_threshold) || 0 }),
    });
    setForm({ name: "", category: "fertilizer", quantity: "", unit: "kg", low_threshold: "10" });
    setShowForm(false);
    loadItems();
  }

  async function handleTransaction(type: "add" | "remove") {
    if (!txItem || !txAmount) return;
    const delta = type === "add" ? Math.abs(parseFloat(txAmount)) : -Math.abs(parseFloat(txAmount));
    await fetch(`/api/farmer/inventory/${txItem.id}?userId=${uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, reason: txReason }),
    });
    setTxItem(null);
    setTxAmount("");
    setTxReason("");
    loadItems();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/farmer/inventory/${id}?userId=${uid}`, { method: "DELETE" });
    loadItems();
  }

  const filtered = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);
  const lowStockItems = items.filter((i) => i.quantity <= i.low_threshold);

  const catLabel = (cat: string) => {
    const map: Record<string, string> = {
      fertilizer: t.fertilizer_inv, pesticide: t.pesticide_inv, seed: t.seed_inv, fuel: t.fuel_inv, equipment: t.equipment_inv,
    };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gd-text-primary">{t.inventory}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium hover:bg-gd-primary/90">
          <Plus className="w-4 h-4" /> {t.addItem}
        </button>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-gd-danger/10 border border-gd-danger/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-gd-danger" />
            <span className="text-sm font-medium text-gd-danger">{t.lowStockAlerts} ({lowStockItems.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item.id} className="text-xs bg-gd-danger/20 text-gd-danger px-2 py-1 rounded-lg">
                {item.name}: {item.quantity} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-gd-text-muted flex-shrink-0" />
        <button onClick={() => setFilterCat("all")} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${filterCat === "all" ? "bg-gd-primary text-white" : "bg-gd-surface text-gd-text-secondary"}`}>
          {lang === "ar" ? "الكل" : "Tout"}
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${filterCat === cat ? "bg-gd-primary text-white" : "bg-gd-surface text-gd-text-secondary"}`}>
            {catLabel(cat)}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isLow = item.quantity <= item.low_threshold;
          return (
            <div key={item.id} className={`rounded-xl border p-4 ${isLow ? "border-gd-danger/40 bg-gd-danger/5" : "border-gd-border bg-gd-card"}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gd-text-primary">{item.name}</h3>
                  <span className="text-[10px] bg-gd-surface text-gd-text-muted px-2 py-0.5 rounded-full">{catLabel(item.category)}</span>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-gd-text-muted hover:text-gd-danger">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <span className={`text-2xl font-bold ${isLow ? "text-gd-danger" : "text-gd-text-primary"}`}>{item.quantity}</span>
                  <span className="text-xs text-gd-text-muted ml-1">{item.unit}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setTxItem(item); setTxAmount(""); setTxReason(""); }} className="p-1.5 rounded-lg bg-gd-surface hover:bg-gd-primary/10 text-gd-primary">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 w-full bg-gd-surface rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${isLow ? "bg-gd-danger" : "bg-gd-primary"}`} style={{ width: `${Math.min(100, (item.quantity / (item.low_threshold * 3)) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-gd-text-muted mt-1">{t.lowThreshold}: {item.low_threshold} {item.unit}</p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gd-text-muted">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t.noData}</p>
        </div>
      )}

      {/* Add Item Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-gd-card rounded-2xl border border-gd-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gd-text-primary">{t.addItem}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gd-text-muted" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input placeholder={`${t.description}*`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" required />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary">
                {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="any" placeholder={t.amount} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary">
                  {UNITS.map((u) => <option key={u} value={u}>{t[u === "unit" ? "unit_item" : u] || u}</option>)}
                </select>
              </div>
              <input type="number" step="any" placeholder={t.lowThreshold} value={form.low_threshold} onChange={(e) => setForm({ ...form, low_threshold: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gd-surface text-gd-text-secondary rounded-xl text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {txItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setTxItem(null)}>
          <div className="bg-gd-card rounded-2xl border border-gd-border p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gd-text-primary mb-1">{txItem.name}</h2>
            <p className="text-xs text-gd-text-muted mb-4">{t.stock}: {txItem.quantity} {txItem.unit}</p>
            <input type="number" step="any" placeholder={t.amount} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary mb-3" />
            <input placeholder={t.description} value={txReason} onChange={(e) => setTxReason(e.target.value)} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary mb-4" />
            <div className="flex gap-3">
              <button onClick={() => handleTransaction("add")} className="flex-1 py-2 bg-gd-success/20 text-gd-success rounded-xl text-sm font-medium flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" /> {t.addStock}
              </button>
              <button onClick={() => handleTransaction("remove")} className="flex-1 py-2 bg-gd-danger/20 text-gd-danger rounded-xl text-sm font-medium flex items-center justify-center gap-1">
                <TrendingDown className="w-4 h-4" /> {t.removeStock}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
