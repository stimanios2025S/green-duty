"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "../layout";
import { farmerLang } from "@/lib/farmer-i18n";
import {
  Plus, TrendingUp, TrendingDown, BookOpen, X, Trash2, Filter,
} from "lucide-react";

const C = {
  bg: "#060608", card: "#131318", surface: "#1e1e27",
  border: "rgba(255,255,255,0.05)", borderSoft: "rgba(255,255,255,0.08)",
  primary: "#84cc16", success: "#22c55e", danger: "#ef4444", warning: "#f59e0b",
  text: "#f4f4f5", textSec: "#a1a1aa", textMuted: "#71717a",
};

interface LedgerEntry {
  id: string; type: string; category: string; amount: number;
  description: string | null; date: string; debt_id: string | null; created_at: string;
}
interface Debt {
  id: string; party_type: string; party_name: string; amount: number;
  paid: number; status: string; description: string | null; due_date: string | null;
}

const INCOME_CATS = ["harvestSale", "wholesale", "subsidy"] as const;
const EXPENSE_CATS = ["diesel", "labor", "seeds", "fertilizer", "pesticide", "equipment", "irrigation", "transport"] as const;

export default function LedgerPage() {
  const { user } = useAuth();
  const { lang } = useFarmerLang();
  const t = farmerLang[lang];
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [tab, setTab] = useState<"ledger" | "debts">("ledger");
  const [form, setForm] = useState({ type: "expense", category: "diesel", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
  const [dForm, setDForm] = useState({ party_type: "supplier", party_name: "", amount: "", paid: "", description: "", due_date: "" });
  const uid = user?.id || "";

  useEffect(() => { if (uid) { loadEntries(); loadDebts(); } }, [uid]);

  async function loadEntries() {
    const res = await fetch(`/api/farmer/ledger?userId=${uid}`);
    if (res.ok) setEntries(await res.json());
  }
  async function loadDebts() {
    const res = await fetch(`/api/farmer/debts?userId=${uid}`);
    if (res.ok) setDebts(await res.json());
  }
  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/farmer/ledger?userId=${uid}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
    });
    setForm({ type: "expense", category: "diesel", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false); loadEntries();
  }
  async function handleAddDebt(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/farmer/debts?userId=${uid}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dForm, amount: parseFloat(dForm.amount) || 0, paid: parseFloat(dForm.paid) || 0 }),
    });
    setDForm({ party_type: "supplier", party_name: "", amount: "", paid: "", description: "", due_date: "" });
    setShowDebtForm(false); loadDebts();
  }
  async function handleDeleteEntry(id: string) {
    await fetch(`/api/farmer/ledger/${id}?userId=${uid}`, { method: "DELETE" }); loadEntries();
  }
  async function handleDeleteDebt(id: string) {
    await fetch(`/api/farmer/debts/${id}?userId=${uid}`, { method: "DELETE" }); loadDebts();
  }
  async function handleMarkPaid(debt: Debt) {
    await fetch(`/api/farmer/debts/${debt.id}?userId=${uid}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...debt, paid: debt.amount, status: "paid" }),
    }); loadDebts();
  }

  const filtered = filterType === "all" ? entries : entries.filter((e) => e.type === filterType);
  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const catLabel = (cat: string) => { const key = cat as keyof typeof t; return t[key] || cat; };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: C.text }}>{t.ledger}</h1>
        <button onClick={() => tab === "ledger" ? setShowForm(true) : setShowDebtForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>
          <Plus className="w-4 h-4" /> {tab === "ledger" ? t.addEntry : t.addDebt}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl p-1" style={{ background: C.surface }}>
        <button onClick={() => setTab("ledger")} className="flex-1 py-2 text-sm font-medium rounded-lg transition"
          style={{ background: tab === "ledger" ? C.card : "transparent", color: tab === "ledger" ? C.text : C.textMuted, boxShadow: tab === "ledger" ? "0 1px 3px rgba(0,0,0,0.3)" : "none" }}>
          {t.ledger}
        </button>
        <button onClick={() => setTab("debts")} className="flex-1 py-2 text-sm font-medium rounded-lg transition"
          style={{ background: tab === "debts" ? C.card : "transparent", color: tab === "debts" ? C.text : C.textMuted }}>
          {t.debts}
        </button>
      </div>

      {tab === "ledger" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t.income, val: totalIncome, color: C.success, icon: TrendingUp },
              { label: t.expense, val: totalExpense, color: C.danger, icon: TrendingDown },
              { label: t.balance, val: totalIncome - totalExpense, color: (totalIncome - totalExpense) >= 0 ? C.success : C.danger, icon: BookOpen },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${C.border}`, background: C.card }}>
                <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.val.toLocaleString()}</p>
                <p className="text-[10px]" style={{ color: C.textMuted }}>{s.label} ({t.currency})</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: C.textMuted }} />
            {(["all", "income", "expense"] as const).map((f) => (
              <button key={f} onClick={() => setFilterType(f)} className="px-3 py-1 rounded-lg text-xs font-medium"
                style={{ background: filterType === f ? C.primary : C.surface, color: filterType === f ? "#060608" : C.textSec }}>
                {f === "all" ? (lang === "ar" ? "الكل" : "Tout") : f === "income" ? t.income : t.expense}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl p-3" style={{ border: `1px solid ${C.border}`, background: C.card }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: entry.type === "income" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
                    {entry.type === "income" ? <TrendingUp className="w-4 h-4" style={{ color: C.success }} /> : <TrendingDown className="w-4 h-4" style={{ color: C.danger }} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.text }}>{catLabel(entry.category)}</p>
                    <p className="text-[10px]" style={{ color: C.textMuted }}>{entry.date}{entry.description ? ` · ${entry.description}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: entry.type === "income" ? C.success : C.danger }}>
                    {entry.type === "income" ? "+" : "-"}{entry.amount.toLocaleString()} {t.currency}
                  </span>
                  <button onClick={() => handleDeleteEntry(entry.id)} style={{ color: C.textMuted }} className="p-1 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-sm py-8" style={{ color: C.textMuted }}>{t.noData}</p>}
          </div>
        </>
      )}

      {tab === "debts" && (
        <div className="space-y-3">
          {debts.map((debt) => (
            <div key={debt.id} className="rounded-xl border p-4" style={{ borderColor: debt.status === "paid" ? "rgba(34,197,94,0.3)" : C.border, background: debt.status === "paid" ? "rgba(34,197,94,0.05)" : C.card }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: debt.party_type === "supplier" ? "rgba(245,158,11,0.2)" : "rgba(132,204,22,0.2)", color: debt.party_type === "supplier" ? C.warning : C.primary }}>
                      {debt.party_type === "supplier" ? t.supplier : t.buyer}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: debt.status === "paid" ? "rgba(34,197,94,0.2)" : debt.status === "partial" ? "rgba(245,158,11,0.2)" : C.surface, color: debt.status === "paid" ? C.success : debt.status === "partial" ? C.warning : C.textMuted }}>
                      {debt.status === "paid" ? t.paid : debt.status === "partial" ? t.partial : t.pending}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mt-1" style={{ color: C.text }}>{debt.party_name}</p>
                  {debt.description && <p className="text-xs" style={{ color: C.textMuted }}>{debt.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {debt.status !== "paid" && (
                    <button onClick={() => handleMarkPaid(debt)} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: "rgba(34,197,94,0.15)", color: C.success }}>
                      {t.markPaid}
                    </button>
                  )}
                  <button onClick={() => handleDeleteDebt(debt.id)} className="p-1" style={{ color: C.textMuted }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <span className="text-lg font-bold" style={{ color: C.text }}>{debt.amount.toLocaleString()} {t.currency}</span>
                  {debt.paid > 0 && <span className="text-xs ml-2" style={{ color: C.textMuted }}>({t.paid}: {debt.paid.toLocaleString()})</span>}
                </div>
                {debt.due_date && <span className="text-[10px]" style={{ color: C.textMuted }}>{t.dueDate}: {debt.due_date}</span>}
              </div>
              {debt.amount > debt.paid && debt.status !== "paid" && (
                <div className="mt-2 w-full rounded-full h-1.5" style={{ background: C.surface }}>
                  <div className="h-1.5 rounded-full" style={{ background: C.primary, width: `${(debt.paid / debt.amount) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
          {debts.length === 0 && <p className="text-center text-sm py-8" style={{ color: C.textMuted }}>{t.noData}</p>}
        </div>
      )}

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.card, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: C.text }}>{t.addEntry}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: C.textMuted }} /></button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-3">
              <div className="flex rounded-xl p-1" style={{ background: C.surface }}>
                <button type="button" onClick={() => setForm({ ...form, type: "income", category: "harvestSale" })} className="flex-1 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-1"
                  style={{ background: form.type === "income" ? "rgba(34,197,94,0.2)" : "transparent", color: form.type === "income" ? C.success : C.textMuted }}>
                  <TrendingUp className="w-4 h-4" /> {t.income}
                </button>
                <button type="button" onClick={() => setForm({ ...form, type: "expense", category: "diesel" })} className="flex-1 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-1"
                  style={{ background: form.type === "expense" ? "rgba(239,68,68,0.2)" : "transparent", color: form.type === "expense" ? C.danger : C.textMuted }}>
                  <TrendingDown className="w-4 h-4" /> {t.expense}
                </button>
              </div>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
              <input type="number" step="any" placeholder={`${t.amount} *`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} required />
              <input placeholder={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: C.surface, color: C.textSec }}>{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showDebtForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowDebtForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.card, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: C.text }}>{t.addDebt}</h2>
              <button onClick={() => setShowDebtForm(false)}><X className="w-5 h-5" style={{ color: C.textMuted }} /></button>
            </div>
            <form onSubmit={handleAddDebt} className="space-y-3">
              <select value={dForm.party_type} onChange={(e) => setDForm({ ...dForm, party_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                <option value="supplier">{t.supplier}</option>
                <option value="buyer">{t.buyer}</option>
              </select>
              <input placeholder={`${t.partyName}*`} value={dForm.party_name} onChange={(e) => setDForm({ ...dForm, party_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} required />
              <input type="number" step="any" placeholder={`${t.amount}*`} value={dForm.amount} onChange={(e) => setDForm({ ...dForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} required />
              <input type="number" step="any" placeholder={t.paid} value={dForm.paid} onChange={(e) => setDForm({ ...dForm, paid: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <input placeholder={t.description} value={dForm.description} onChange={(e) => setDForm({ ...dForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <div>
                <label className="text-[10px] mb-1 block" style={{ color: C.textMuted }}>{t.dueDate}</label>
                <input type="date" value={dForm.due_date} onChange={(e) => setDForm({ ...dForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDebtForm(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: C.surface, color: C.textSec }}>{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
