"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Users, CheckSquare, StickyNote, Plus, Trash2, Phone, Mail,
  Building2, Calendar, Flag, Search, X
} from "lucide-react";

type Tab = "contacts" | "tasks" | "notes";

interface Contact { id: string; name: string; company: string; phone: string; email: string; category: string; notes: string; last_contacted: string; created_at: string; }
interface Task { id: string; title: string; description: string; due_date: string; priority: string; status: string; created_at: string; }
interface Note { id: string; title: string; content: string; tags: string; created_at: string; }

const PRIORITY_COLORS: Record<string, string> = { low: "#71717a", medium: "#f59e0b", high: "#ef4444", urgent: "#dc2626" };
const CATEGORY_LABELS: Record<string, string> = { supplier: "Fournisseur", farmer: "Agriculteur", logistics: "Logistique", partner: "Partenaire", other: "Autre" };

export default function BuyerCRMPage() {
  const { user } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    void Promise.resolve().then(loadAll);
  }, [user, router, loadAll]);

  const todayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(new Date().toISOString().slice(0, 10)));
  const pendingTasks = tasks.filter(t => t.status === "pending");

  return (
    <div style={{ minHeight: "100vh", background: "#060608", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "'Lexend', sans-serif", fontSize: "1.75rem", fontWeight: 300, color: "#f4f4f5", letterSpacing: "-0.02em" }}>
            📋 CRM Quotidien
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#71717a", marginTop: "0.25rem" }}>
            Gérez vos contacts, tâches et notes d&apos;achat
          </p>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Contacts", value: contacts.length, icon: Users, color: "#84cc16" },
            { label: "Tâches aujourd'hui", value: todayTasks.length, icon: CheckSquare, color: "#f59e0b" },
            { label: "En attente", value: pendingTasks.length, icon: Flag, color: "#ef4444" },
            { label: "Notes", value: notes.length, icon: StickyNote, color: "#3b82f6" },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <s.icon style={{ width: "1rem", height: "1rem", color: s.color }} />
                <span style={{ fontSize: "0.6875rem", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: "1.5rem", fontWeight: 300, color: "#f4f4f5", fontFamily: "'Lexend', sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", padding: "3px", marginBottom: "1.5rem" }}>
          {([["contacts", "Contacts", Users], ["tasks", "Tâches", CheckSquare], ["notes", "Notes", StickyNote]] as const).map(([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setShowForm(false); setSearch(""); }}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                borderRadius: "0.625rem", padding: "0.5rem 0", border: "none", cursor: "pointer",
                fontSize: "0.8125rem", fontWeight: 500, fontFamily: "'Lexend', sans-serif",
                transition: "all 0.2s ease",
                ...(tab === t
                  ? { background: "linear-gradient(135deg, #84cc16, #65a30d)", color: "#060608" }
                  : { background: "transparent", color: "#71717a" }),
              }}
            >
              <Icon style={{ width: "1rem", height: "1rem" }} />
              {label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#71717a", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.03)", padding: "0.625rem 0.75rem 0.625rem 2.5rem",
                fontSize: "0.8125rem", color: "#f4f4f5", outline: "none", fontFamily: "'Lexend', sans-serif",
              }}
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              borderRadius: "0.75rem", border: "none", cursor: "pointer",
              padding: "0.625rem 1rem", fontSize: "0.8125rem", fontWeight: 600,
              fontFamily: "'Lexend', sans-serif",
              background: "linear-gradient(135deg, #84cc16, #65a30d)", color: "#060608",
            }}
          >
            {showForm ? <X style={{ width: "1rem", height: "1rem" }} /> : <Plus style={{ width: "1rem", height: "1rem" }} />}
            {showForm ? "Annuler" : tab === "contacts" ? "Contact" : tab === "tasks" ? "Tâche" : "Note"}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ borderRadius: "0.75rem", border: "1px solid rgba(132,204,22,0.15)", background: "rgba(132,204,22,0.03)", padding: "1.25rem", marginBottom: "1rem" }}>
            {tab === "contacts" && <ContactForm onDone={() => { setShowForm(false); loadAll(); }} userId={user!.id} />}
            {tab === "tasks" && <TaskForm onDone={() => { setShowForm(false); loadAll(); }} userId={user!.id} />}
            {tab === "notes" && <NoteForm onDone={() => { setShowForm(false); loadAll(); }} userId={user!.id} />}
          </div>
        )}

        {/* Content */}
        {tab === "contacts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {contacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", padding: "0.875rem 1rem" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "rgba(132,204,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#84cc16", fontWeight: 600, fontSize: "0.8125rem" }}>
                  {c.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f4f4f5" }}>{c.name}</p>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.125rem" }}>
                    {c.company && <span style={{ fontSize: "0.6875rem", color: "#71717a", display: "flex", alignItems: "center", gap: "0.25rem" }}><Building2 style={{ width: "0.75rem", height: "0.75rem" }} />{c.company}</span>}
                    {c.phone && <span style={{ fontSize: "0.6875rem", color: "#71717a", display: "flex", alignItems: "center", gap: "0.25rem" }}><Phone style={{ width: "0.75rem", height: "0.75rem" }} />{c.phone}</span>}
                    {c.email && <span style={{ fontSize: "0.6875rem", color: "#71717a", display: "flex", alignItems: "center", gap: "0.25rem" }}><Mail style={{ width: "0.75rem", height: "0.75rem" }} />{c.email}</span>}
                  </div>
                </div>
                <span style={{ fontSize: "0.625rem", padding: "0.25rem 0.5rem", borderRadius: "9999px", background: "rgba(255,255,255,0.04)", color: "#71717a" }}>
                  {CATEGORY_LABELS[c.category] || c.category}
                </span>
                <button onClick={async () => { await fetch(`/api/buyer/crm/contacts?id=${c.id}`, { method: "DELETE" }); loadAll(); }} style={{ padding: "0.375rem", border: "none", background: "none", cursor: "pointer", color: "#71717a" }}>
                  <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                </button>
              </div>
            ))}
            {contacts.length === 0 && <p style={{ textAlign: "center", color: "#71717a", padding: "3rem 0", fontSize: "0.8125rem" }}>Aucun contact. Ajoutez votre premier contact !</p>}
          </div>
        )}

        {tab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase())).map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", padding: "0.875rem 1rem" }}>
                <button
                  onClick={async () => {
                    const newStatus = t.status === "completed" ? "pending" : "completed";
                    await fetch(`/api/buyer/crm/tasks`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, status: newStatus }) });
                    loadAll();
                  }}
                  style={{
                    width: "1.25rem", height: "1.25rem", borderRadius: "0.25rem", flexShrink: 0,
                    border: `2px solid ${t.status === "completed" ? "#84cc16" : "rgba(255,255,255,0.15)"}`,
                    background: t.status === "completed" ? "#84cc16" : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {t.status === "completed" && <span style={{ color: "#060608", fontSize: "0.625rem", fontWeight: 700 }}>✓</span>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: t.status === "completed" ? "#71717a" : "#f4f4f5", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</p>
                  {t.due_date && <span style={{ fontSize: "0.6875rem", color: "#71717a", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.125rem" }}><Calendar style={{ width: "0.75rem", height: "0.75rem" }} />{t.due_date}</span>}
                </div>
                <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: PRIORITY_COLORS[t.priority] || "#71717a" }} />
                <button onClick={async () => { await fetch(`/api/buyer/crm/tasks?id=${t.id}`, { method: "DELETE" }); loadAll(); }} style={{ padding: "0.375rem", border: "none", background: "none", cursor: "pointer", color: "#71717a" }}>
                  <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                </button>
              </div>
            ))}
            {tasks.length === 0 && <p style={{ textAlign: "center", color: "#71717a", padding: "3rem 0", fontSize: "0.8125rem" }}>Aucune tâche. Planifiez votre première tâche !</p>}
          </div>
        )}

        {tab === "notes" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
            {notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())).map(n => (
              <div key={n.id} style={{ borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f4f4f5" }}>{n.title}</h4>
                  <button onClick={async () => { await fetch(`/api/buyer/crm/notes?id=${n.id}`, { method: "DELETE" }); loadAll(); }} style={{ padding: "0.25rem", border: "none", background: "none", cursor: "pointer", color: "#71717a" }}>
                    <Trash2 style={{ width: "0.75rem", height: "0.75rem" }} />
                  </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#a1a1aa", lineHeight: 1.6, marginBottom: "0.5rem" }}>{n.content.slice(0, 200)}</p>
                {n.tags && <span style={{ fontSize: "0.625rem", color: "#84cc16", background: "rgba(132,204,22,0.08)", padding: "0.125rem 0.375rem", borderRadius: "9999px" }}>{n.tags}</span>}
              </div>
            ))}
            {notes.length === 0 && <p style={{ textAlign: "center", color: "#71717a", padding: "3rem 0", fontSize: "0.8125rem", gridColumn: "1 / -1" }}>Aucune note. Prenez votre première note !</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Forms ── */

function ContactForm({ onDone, userId }: { onDone: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("supplier");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/buyer/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, company, phone, email, category, notes }),
    });
    onDone();
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
      <input placeholder="Nom *" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input placeholder="Entreprise" value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} />
      <input placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
        <option value="supplier">Fournisseur</option>
        <option value="farmer">Agriculteur</option>
        <option value="logistics">Logistique</option>
        <option value="partner">Partenaire</option>
        <option value="other">Autre</option>
      </select>
      <input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} />
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" style={{ ...btnStyle, gridColumn: "auto" }}>Ajouter le contact</button>
      </div>
    </form>
  );
}

function TaskForm({ onDone, userId }: { onDone: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/buyer/crm/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, description, due_date: dueDate, priority }),
    });
    onDone();
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
      <input placeholder="Titre de la tâche *" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, gridColumn: "1 / -1" }} />
      <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
      <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
        <option value="low">Faible</option>
        <option value="medium">Moyen</option>
        <option value="high">Élevé</option>
        <option value="urgent">Urgent</option>
      </select>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" style={btnStyle}>Ajouter la tâche</button>
      </div>
    </form>
  );
}

function NoteForm({ onDone, userId }: { onDone: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await fetch("/api/buyer/crm/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, content, tags }),
    });
    onDone();
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
      <input placeholder="Titre *" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
      <input placeholder="Tags (séparés par virgule)" value={tags} onChange={e => setTags(e.target.value)} style={inputStyle} />
      <textarea placeholder="Contenu de la note *" value={content} onChange={e => setContent(e.target.value)} rows={3} style={{ ...inputStyle, gridColumn: "1 / -1", resize: "vertical" }} />
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" style={btnStyle}>Ajouter la note</button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.03)", padding: "0.625rem 0.875rem",
  fontSize: "0.8125rem", color: "#f4f4f5", outline: "none", fontFamily: "'Lexend', sans-serif",
};

const btnStyle: React.CSSProperties = {
  borderRadius: "0.75rem", border: "none", cursor: "pointer",
  padding: "0.625rem 1.25rem", fontSize: "0.8125rem", fontWeight: 600,
  fontFamily: "'Lexend', sans-serif",
  background: "linear-gradient(135deg, #84cc16, #65a30d)", color: "#060608",
};
