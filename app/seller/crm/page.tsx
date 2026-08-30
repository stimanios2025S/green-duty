"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Users, CheckSquare, StickyNote, Plus, Trash2, Phone, Mail,
  Building2, Calendar, Flag, Search, X
} from "lucide-react";

type Tab = "contacts" | "tasks" | "notes";

interface Contact { id: string; name: string; company: string; phone: string; email: string; category: string; notes: string; last_contacted: string; created_at: string; }
interface Task { id: string; title: string; description: string; due_date: string; priority: string; status: string; created_at: string; }
interface Note { id: string; title: string; content: string; tags: string; created_at: string; }

const PRIORITY_COLORS: Record<string, string> = { low: "#71717a", medium: "#f59e0b", high: "#ef4444", urgent: "#dc2626" };
const CATEGORY_LABELS: Record<string, string> = { buyer: "Acheteur", supplier: "Fournisseur", logistics: "Logistique", partner: "Partenaire", other: "Autre" };

export default function SellerCRMPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("contacts");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      const [cRes, tRes, nRes] = await Promise.all([
        fetch(`/api/buyer/crm/contacts?userId=${user.id}`),
        fetch(`/api/buyer/crm/tasks?userId=${user.id}`),
        fetch(`/api/buyer/crm/notes?userId=${user.id}`),
      ]);
      const [c, t, n] = await Promise.all([cRes.json(), tRes.json(), nRes.json()]);
      setContacts(c.contacts || []);
      setTasks(t.tasks || []);
      setNotes(n.notes || []);
    } catch {}
  }, [user]);

  useEffect(() => { void Promise.resolve().then(loadAll); }, [loadAll]);

  const todayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(new Date().toISOString().slice(0, 10)));
  const pendingTasks = tasks.filter(t => t.status === "pending");

  return (
    <div className="min-h-screen bg-gd-deepest p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">📋 CRM Vendeur</h1>
          <p className="mt-1 text-sm text-gd-text-secondary">Gérez vos clients, tâches de vente et notes</p>
        </div>

        {/* Quick stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Clients", value: contacts.length, icon: Users, color: "text-gd-olive-400" },
            { label: "Tâches aujourd'hui", value: todayTasks.length, icon: CheckSquare, color: "text-gd-accent-400" },
            { label: "En attente", value: pendingTasks.length, icon: Flag, color: "text-gd-danger" },
            { label: "Notes", value: notes.length, icon: StickyNote, color: "text-gd-info" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gd-border bg-gd-card p-3.5">
              <div className="mb-1 flex items-center gap-1.5">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gd-text-primary">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="mb-4 flex gap-1 rounded-xl border border-gd-border bg-gd-card p-1">
          {([["contacts", "Contacts", Users], ["tasks", "Tâches", CheckSquare], ["notes", "Notes", StickyNote]] as const).map(([t, label, Icon]) => (
            <button key={t} onClick={() => { setTab(t); setShowForm(false); setSearch(""); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === t ? "bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 text-gd-text-inverse" : "text-gd-text-muted hover:text-gd-text-secondary"
              }`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gd-border bg-gd-card py-2.5 pl-9 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-olive-500/40" />
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Annuler" : tab === "contacts" ? "Client" : tab === "tasks" ? "Tâche" : "Note"}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-4 rounded-xl border border-gd-olive-500/15 bg-gd-olive-500/5 p-5">
            {tab === "contacts" && <ContactForm onDone={() => { setShowForm(false); loadAll(); }} />}
            {tab === "tasks" && <TaskForm onDone={() => { setShowForm(false); loadAll(); }} />}
            {tab === "notes" && <NoteForm onDone={() => { setShowForm(false); loadAll(); }} />}
          </div>
        )}

        {/* Contacts */}
        {tab === "contacts" && (
          <div className="space-y-2">
            {contacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())).map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-card px-4 py-3 hover:bg-gd-elevated transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-olive-500/10 text-sm font-bold text-gd-olive-400">{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gd-text-primary">{c.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-3">
                    {c.company && <span className="flex items-center gap-1 text-[11px] text-gd-text-muted"><Building2 className="h-3 w-3" />{c.company}</span>}
                    {c.phone && <span className="flex items-center gap-1 text-[11px] text-gd-text-muted"><Phone className="h-3 w-3" />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-1 text-[11px] text-gd-text-muted"><Mail className="h-3 w-3" />{c.email}</span>}
                  </div>
                </div>
                <span className="rounded-full bg-gd-elevated px-2.5 py-1 text-[10px] text-gd-text-muted">{CATEGORY_LABELS[c.category] || c.category}</span>
                <button onClick={async () => { await fetch(`/api/buyer/crm/contacts?id=${c.id}`, { method: "DELETE" }); loadAll(); }}
                  className="p-1.5 text-gd-text-muted hover:text-gd-danger transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {contacts.length === 0 && <p className="py-12 text-center text-sm text-gd-text-muted">Aucun contact. Ajoutez votre premier client !</p>}
          </div>
        )}

        {/* Tasks */}
        {tab === "tasks" && (
          <div className="space-y-2">
            {tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase())).map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-card px-4 py-3">
                <button onClick={async () => {
                  await fetch("/api/buyer/crm/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, status: t.status === "completed" ? "pending" : "completed" }) });
                  loadAll();
                }} className={`h-5 w-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                  t.status === "completed" ? "border-gd-olive-500 bg-gd-olive-500" : "border-gd-border-strong"
                }`}>
                  {t.status === "completed" && <span className="text-[10px] font-bold text-gd-text-inverse">✓</span>}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${t.status === "completed" ? "text-gd-text-muted line-through" : "text-gd-text-primary"}`}>{t.title}</p>
                  {t.due_date && <span className="mt-0.5 flex items-center gap-1 text-[11px] text-gd-text-muted"><Calendar className="h-3 w-3" />{t.due_date}</span>}
                </div>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLORS[t.priority] || "#71717a" }} />
                <button onClick={async () => { await fetch(`/api/buyer/crm/tasks?id=${t.id}`, { method: "DELETE" }); loadAll(); }}
                  className="p-1.5 text-gd-text-muted hover:text-gd-danger transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {tasks.length === 0 && <p className="py-12 text-center text-sm text-gd-text-muted">Aucune tâche. Planifiez votre première vente !</p>}
          </div>
        )}

        {/* Notes */}
        {tab === "notes" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())).map(n => (
              <div key={n.id} className="rounded-xl border border-gd-border bg-gd-card p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="text-sm font-semibold text-gd-text-primary">{n.title}</h4>
                  <button onClick={async () => { await fetch(`/api/buyer/crm/notes?id=${n.id}`, { method: "DELETE" }); loadAll(); }}
                    className="p-1 text-gd-text-muted hover:text-gd-danger transition-colors"><Trash2 className="h-3 w-3" /></button>
                </div>
                <p className="mb-2 text-xs text-gd-text-secondary leading-relaxed">{n.content.slice(0, 200)}</p>
                {n.tags && <span className="rounded-full bg-gd-olive-500/10 px-2.5 py-0.5 text-[10px] text-gd-olive-400">{n.tags}</span>}
              </div>
            ))}
            {notes.length === 0 && <p className="py-12 text-center text-sm text-gd-text-muted sm:col-span-2 lg:col-span-3">Aucune note. Prenez votre première note !</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Forms ── */

function ContactForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("buyer");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    await fetch("/api/buyer/crm/contacts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, name, company, phone, email, category, notes }),
    });
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input placeholder="Nom du client *" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
      <input placeholder="Entreprise" value={company} onChange={e => setCompany(e.target.value)} className={inputCls} />
      <input placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
      <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
        <option value="buyer">Acheteur</option>
        <option value="supplier">Fournisseur</option>
        <option value="logistics">Logistique</option>
        <option value="partner">Partenaire</option>
        <option value="other">Autre</option>
      </select>
      <input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
      <div className="sm:col-span-2 flex justify-end"><button type="submit" className={btnCls}>Ajouter le client</button></div>
    </form>
  );
}

function TaskForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    await fetch("/api/buyer/crm/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, title, description, due_date: dueDate, priority }),
    });
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input placeholder="Titre de la tâche *" value={title} onChange={e => setTitle(e.target.value)} className={`${inputCls} sm:col-span-2`} />
      <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className={inputCls} />
      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
      <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
        <option value="low">Faible</option>
        <option value="medium">Moyen</option>
        <option value="high">Élevé</option>
        <option value="urgent">Urgent</option>
      </select>
      <div className="sm:col-span-2 flex justify-end"><button type="submit" className={btnCls}>Ajouter la tâche</button></div>
    </form>
  );
}

function NoteForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;
    await fetch("/api/buyer/crm/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, title, content, tags }),
    });
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input placeholder="Titre *" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
      <input placeholder="Tags (séparés par virgule)" value={tags} onChange={e => setTags(e.target.value)} className={inputCls} />
      <textarea placeholder="Contenu de la note *" value={content} onChange={e => setContent(e.target.value)} rows={3} className={`${inputCls} sm:col-span-2 resize-none`} />
      <div className="sm:col-span-2 flex justify-end"><button type="submit" className={btnCls}>Ajouter la note</button></div>
    </form>
  );
}

const inputCls = "rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-olive-500/40 transition-colors";
const btnCls = "rounded-xl bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all";
