"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "../layout";
import { farmerLang } from "@/lib/farmer-i18n";
import {
  Plus, TrendingUp, TrendingDown, BookOpen, X, Trash2, Filter,
} from "lucide-react";

interface LedgerEntry {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  debt_id: string | null;
  created_at: string;
}

interface Debt {
  id: string;
  party_type: string;
  party_name: string;
  amount: number;
  paid: number;
  status: string;
  description: string | null;
  due_date: string | null;
}

const INCOME_CATEGORIES = ["harvestSale", "wholesale", "subsidy"] as const;
const EXPENSE_CATEGORIES = ["diesel", "labor", "seeds", "fertilizer", "pesticide", "equipment", "irrigation", "transport"] as const;

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

  const [form, setForm] = useState({
    type: "expense", category: "diesel", amount: "", description: "", date: new Date().toISOString().split("T")[0],
  });
  const [dForm, setDForm] = useState({
    party_type: "supplier", party_name: "", amount: "", paid: "", description: "", due_date: "",
  });

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
    });
    setForm({ type: "expense", category: "diesel", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    loadEntries();
  }

  async function handleAddDebt(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/farmer/debts?userId=${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dForm, amount: parseFloat(dForm.amount) || 0, paid: parseFloat(dForm.paid) || 0 }),
    });
    setDForm({ party_type: "supplier", party_name: "", amount: "", paid: "", description: "", due_date: "" });
    setShowDebtForm(false);
    loadDebts();
  }

  async function handleDeleteEntry(id: string) {
    await fetch(`/api/farmer/ledger/${id}?userId=${uid}`, { method: "DELETE" });
    loadEntries();
  }

  async function handleDeleteDebt(id: string) {
    await fetch(`/api/farmer/debts/${id}?userId=${uid}`, { method: "DELETE" });
    loadDebts();
  }

  async function handleMarkPaid(debt: Debt) {
    await fetch(`/api/farmer/debts/${debt.id}?userId=${uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...debt, paid: debt.amount, status: "paid" }),
    });
    loadDebts();
  }

  const filtered = filterType === "all" ? entries : entries.filter((e) => e.type === filterType);
  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  const catLabel = (cat: string) => {
    const key = cat as keyof typeof t;
    return t[key] || cat;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gd-text-primary">{t.ledger}</h1>
        <button
          onClick={() => tab === "ledger" ? setShowForm(true) : setShowDebtForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium hover:bg-gd-primary/90"
        >
          <Plus className="w-4 h-4" /> {tab === "ledger" ? t.addEntry : t.addDebt}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gd-surface rounded-xl p-1">
        <button onClick={() => setTab("ledger")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === "ledger" ? "bg-gd-card text-gd-text-primary shadow-sm" : "text-gd-text-muted"}`}>
          {t.ledger}
        </button>
        <button onClick={() => setTab("debts")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === "debts" ? "bg-gd-card text-gd-text-primary shadow-sm" : "text-gd-text-muted"}`}>
          {t.debts}
        </button>
      </div>

      {tab === "ledger" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gd-border bg-gd-card p-3 text-center">
              <TrendingUp className="w-4 h-4 text-gd-success mx-auto mb-1" />
              <p className="text-lg font-bold text-gd-success">{totalIncome.toLocaleString()}</p>
              <p className="text-[10px] text-gd-text-muted">{t.income} ({t.currency})</p>
            </div>
            <div className="rounded-xl border border-gd-border bg-gd-card p-3 text-center">
              <TrendingDown className="w-4 h-4 text-gd-danger mx-auto mb-1" />
              <p className="text-lg font-bold text-gd-danger">{totalExpense.toLocaleString()}</p>
              <p className="text-[10px] text-gd-text-muted">{t.expense} ({t.currency})</p>
            </div>
            <div className="rounded-xl border border-gd-border bg-gd-card p-3 text-center">
              <BookOpen className="w-4 h-4 text-gd-primary mx-auto mb-1" />
              <p className={`text-lg font-bold ${(totalIncome - totalExpense) >= 0 ? "text-gd-success" : "text-gd-danger"}`}>
                {(totalIncome - totalExpense).toLocaleString()}
              </p>
              <p className="text-[10px] text-gd-text-muted">{t.balance} ({t.currency})</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gd-text-muted" />
            {(["all", "income", "expense"] as const).map((f) => (
              <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filterType === f ? "bg-gd-primary text-white" : "bg-gd-surface text-gd-text-secondary"}`}>
                {f === "all" ? (lang === "ar" ? "الكل" : "Tout") : f === "income" ? t.income : t.expense}
              </button>
            ))}
          </div>

          {/* Entry list */}
          <div className="space-y-2">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-gd-card border border-gd-border rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.type === "income" ? "bg-gd-success/15" : "bg-gd-danger/15"}`}>
                    {entry.type === "income" ? <TrendingUp className="w-4 h-4 text-gd-success" /> : <TrendingDown className="w-4 h-4 text-gd-danger" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gd-text-primary">{catLabel(entry.category)}</p>
                    <p className="text-[10px] text-gd-text-muted">{entry.date}{entry.description ? ` · ${entry.description}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${entry.type === "income" ? "text-gd-success" : "text-gd-danger"}`}>
                    {entry.type === "income" ? "+" : "-"}{entry.amount.toLocaleString()} {t.currency}
                  </span>
                  <button onClick={() => handleDeleteEntry(entry.id)} className="text-gd-text-muted hover:text-gd-danger p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-sm text-gd-text-muted py-8">{t.noData}</p>}
          </div>
        </>
      )}

      {tab === "debts" && (
        <div className="space-y-3">
          {debts.map((debt) => (
            <div key={debt.id} className={`rounded-xl border p-4 ${debt.status === "paid" ? "border-gd-success/30 bg-gd-success/5" : "border-gd-border bg-gd-card"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${debt.party_type === "supplier" ? "bg-gd-warning/20 text-gd-warning" : "bg-gd-primary/20 text-gd-primary"}`}>
                      {debt.party_type === "supplier" ? t.supplier : t.buyer}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${debt.status === "paid" ? "bg-gd-success/20 text-gd-success" : debt.status === "partial" ? "bg-gd-warning/20 text-gd-warning" : "bg-gd-surface text-gd-text-muted"}`}>
                      {debt.status === "paid" ? t.paid : debt.status === "partial" ? t.partial : t.pending}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gd-text-primary mt-1">{debt.party_name}</p>
                  {debt.description && <p className="text-xs text-gd-text-muted">{debt.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {debt.status !== "paid" && (
                    <button onClick={() => handleMarkPaid(debt)} className="text-xs bg-gd-success/15 text-gd-success px-2 py-1 rounded-lg font-medium">
                      {t.markPaid}
                    </button>
                  )}
                  <button onClick={() => handleDeleteDebt(debt.id)} className="text-gd-text-muted hover:text-gd-danger p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <span className="text-lg font-bold text-gd-text-primary">{debt.amount.toLocaleString()} {t.currency}</span>
                  {debt.paid > 0 && <span className="text-xs text-gd-text-muted ml-2">({t.paid}: {debt.paid.toLocaleString()})</span>}
                </div>
                {debt.due_date && <span className="text-[10px] text-gd-text-muted">{t.dueDate}: {debt.due_date}</span>}
              </div>
              {debt.amount > debt.paid && debt.status !== "paid" && (
                <div className="mt-2 w-full bg-gd-surface rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gd-primary" style={{ width: `${(debt.paid / debt.amount) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
          {debts.length === 0 && <p className="text-center text-sm text-gd-text-muted py-8">{t.noData}</p>}
        </div>
      )}

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-gd-card rounded-2xl border border-gd-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gd-text-primary">{t.addEntry}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gd-text-muted" /></button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-3">
              {/* Type toggle */}
              <div className="flex bg-gd-surface rounded-xl p-1">
                <button type="button" onClick={() => setForm({ ...form, type: "income", category: "harvestSale" })} className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${form.type === "income" ? "bg-gd-success/20 text-gd-success" : "text-gd-text-muted"}`}>
                  <TrendingUp className="w-4 h-4 inline mr-1" /> {t.income}
                </button>
                <button type="button" onClick={() => setForm({ ...form, type: "expense", category: "diesel" })} className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${form.type === "expense" ? "bg-gd-danger/20 text-gd-danger" : "text-gd-text-muted"}`}>
                  <TrendingDown className="w-4 h-4 inline mr-1" /> {t.expense}
                </button>
              </div>

              {/* Category */}
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary">
                {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c}>{catLabel(c)}</option>
                ))}
              </select>

              <input type="number" step="any" placeholder={`${t.amount} *`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" required />
              <input placeholder={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gd-surface text-gd-text-secondary rounded-xl text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showDebtForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDebtForm(false)}>
          <div className="bg-gd-card rounded-2xl border border-gd-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gd-text-primary">{t.addDebt}</h2>
              <button onClick={() => setShowDebtForm(false)}><X className="w-5 h-5 text-gd-text-muted" /></button>
            </div>
            <form onSubmit={handleAddDebt} className="space-y-3">
              <select value={dForm.party_type} onChange={(e) => setDForm({ ...dForm, party_type: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary">
                <option value="supplier">{t.supplier}</option>
                <option value="buyer">{t.buyer}</option>
              </select>
              <input placeholder={`${t.partyName}*`} value={dForm.party_name} onChange={(e) => setDForm({ ...dForm, party_name: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" required />
              <input type="number" step="any" placeholder={`${t.amount}*`} value={dForm.amount} onChange={(e) => setDForm({ ...dForm, amount: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" required />
              <input type="number" step="any" placeholder={t.paid} value={dForm.paid} onChange={(e) => setDForm({ ...dForm, paid: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
              <input placeholder={t.description} value={dForm.description} onChange={(e) => setDForm({ ...dForm, description: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
              <div>
                <label className="text-[10px] text-gd-text-muted mb-1 block">{t.dueDate}</label>
                <input type="date" value={dForm.due_date} onChange={(e) => setDForm({ ...dForm, due_date: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDebtForm(false)} className="flex-1 py-2 bg-gd-surface text-gd-text-secondary rounded-xl text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
