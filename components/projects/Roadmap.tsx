"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  ErrorNote,
  Select,
  TextArea,
  TextInput,
  ProgressBar,
} from "@/components/dashboard/kit";
import {
  DELIVERABLE_STATUS_VARIANT,
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_TYPES,
  DELIVERABLE_TYPE_LABEL,
  MILESTONE_PHASES,
  MILESTONE_PHASE_LABEL,
  MILESTONE_STATUSES,
  MILESTONE_STATUS_LABEL,
  MILESTONE_STATUS_VARIANT,
  formatMoney,
} from "@/lib/agency";

/**
 * The project roadmap.
 *
 * `owner` toggles edit controls. The client view renders read-only and never
 * receives `owner_note` in the first place — the API strips it server-side, so
 * there is nothing here to accidentally reveal.
 */

interface Deliverable {
  id: string;
  milestone_id: string;
  title: string;
  type: string;
  description: string | null;
  status: string;
  due_date: string | null;
  amount: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  phase: string;
  order_index: number;
  status: string;
  due_date: string | null;
  progress: number;
  owner_note?: string | null;
  client_visible: number;
}

const emptyForm = () => ({
  title: "",
  description: "",
  phase: "discovery",
  status: "pending",
  dueDate: "",
  progress: 0,
  ownerNote: "",
  clientVisible: true,
});

export function Roadmap({ projectId, owner }: { projectId: string; owner: boolean }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deliverableFor, setDeliverableFor] = useState<string | null>(null);

  const refresh = () => setReloadKey(k => k + 1);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/milestones?projectId=${encodeURIComponent(projectId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d) return;
        setMilestones(d.milestones || []);
        setDeliverables(d.deliverables || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadKey]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  };

  const openEdit = (m: Milestone) => {
    setEditing(m);
    setForm({
      title: m.title || "",
      description: m.description || "",
      phase: m.phase || "discovery",
      status: m.status || "pending",
      dueDate: m.due_date || "",
      progress: m.progress ?? 0,
      ownerNote: m.owner_note || "",
      clientVisible: m.client_visible !== 0,
    });
    setError("");
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("A milestone needs a title.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = { ...form, projectId };
    const res = editing
      ? await fetch(`/api/milestones/${encodeURIComponent(editing.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (res.ok) {
      setFormOpen(false);
      refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Couldn't save that milestone.");
    }
    setSaving(false);
  };

  const removeMilestone = async (id: string) => {
    const res = await fetch(`/api/milestones/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) refresh();
    else setError("Couldn't delete that milestone.");
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...milestones];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setMilestones(next);
    const res = await fetch("/api/milestones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map(m => m.id) }),
    });
    if (!res.ok) setError("Couldn't save the new order.");
    else refresh();
  };

  const toggleVisible = async (m: Milestone) => {
    const res = await fetch(`/api/milestones/${encodeURIComponent(m.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientVisible: m.client_visible === 0 }),
    });
    if (res.ok) refresh();
    else setError("Couldn't change visibility.");
  };

  const quickStatus = async (m: Milestone, status: string) => {
    const res = await fetch(`/api/milestones/${encodeURIComponent(m.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) refresh();
    else setError("Couldn't update the status.");
  };

  if (loading) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-gd-text-muted">Loading the roadmap…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ErrorNote>{error}</ErrorNote>

      {owner && (
        <div className="flex justify-end">
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add milestone
          </PrimaryButton>
        </div>
      )}

      {milestones.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-gd-text-muted">
            {owner ? "No milestones yet. Add the first one to lay out the plan." : "The plan hasn't been published yet."}
          </p>
        </Card>
      ) : (
        milestones.map((m, i) => {
          const rows = deliverables.filter(d => d.milestone_id === m.id);
          return (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gd-text-primary">{m.title}</span>
                    <Badge variant={MILESTONE_STATUS_VARIANT[m.status] || "default"}>
                      {MILESTONE_STATUS_LABEL[m.status] || m.status}
                    </Badge>
                    <Badge>{MILESTONE_PHASE_LABEL[m.phase] || m.phase}</Badge>
                    {owner && m.client_visible === 0 && <Badge variant="warning">Hidden from client</Badge>}
                  </div>
                  {m.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-gd-text-secondary">{m.description}</p>
                  )}
                  {m.due_date && <p className="mt-1 text-[11px] text-gd-text-muted">Due {m.due_date}</p>}
                  {owner && m.owner_note && (
                    <p className="mt-2 rounded-lg border border-gd-border bg-gd-elevated/40 px-3 py-2 text-[11px] text-gd-text-muted">
                      Private note: {m.owner_note}
                    </p>
                  )}
                </div>

                {owner && (
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded-lg p-1.5 text-gd-text-muted hover:bg-gd-elevated disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === milestones.length - 1}
                      className="rounded-lg p-1.5 text-gd-text-muted hover:bg-gd-elevated disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVisible(m)}
                      className="rounded-lg p-1.5 text-gd-text-muted hover:bg-gd-elevated"
                      title={m.client_visible === 0 ? "Show to client" : "Hide from client"}
                    >
                      {m.client_visible === 0 ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-gd-accent-400 hover:bg-gd-elevated"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMilestone(m.id)}
                      className="rounded-lg p-1.5 text-gd-text-muted hover:bg-gd-danger/10 hover:text-gd-danger"
                      title="Delete milestone"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={m.progress} className="flex-1" />
                <span className="text-[11px] text-gd-text-muted">{m.progress}%</span>
              </div>

              {owner && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gd-border pt-3">
                  <Select
                    value={m.status}
                    onChange={e => quickStatus(m, e.target.value)}
                    className="w-36 px-2 py-1 text-xs"
                    aria-label={`Status for ${m.title}`}
                  >
                    {MILESTONE_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {MILESTONE_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                  <GhostButton onClick={() => setDeliverableFor(m.id)} className="px-3 py-1.5 text-xs">
                    <Plus className="h-3 w-3" /> Deliverable
                  </GhostButton>
                </div>
              )}

              {rows.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-gd-border pt-3">
                  {rows.map(d => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gd-border bg-gd-elevated/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gd-text-primary">{d.title}</p>
                        <p className="text-[10px] text-gd-text-muted">
                          {DELIVERABLE_TYPE_LABEL[d.type] || d.type}
                          {d.due_date ? ` · due ${d.due_date}` : ""}
                          {owner && d.amount ? ` · ${formatMoney(d.amount)}` : ""}
                        </p>
                      </div>
                      <Badge variant={DELIVERABLE_STATUS_VARIANT[d.status] || "default"}>
                        {DELIVERABLE_STATUS_LABEL[d.status] || d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Milestone form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit milestone" : "Add milestone"}
        wide
      >
        <div className="space-y-4">
          <Field label="Title">
            <TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phase">
              <Select value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
                {MILESTONE_PHASES.map(p => (
                  <option key={p} value={p}>
                    {MILESTONE_PHASE_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {MILESTONE_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {MILESTONE_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <TextInput type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <Field label="Progress (%)">
              <TextInput
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={e =>
                  setForm({ ...form, progress: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                }
              />
            </Field>
          </div>
          <Field label="Private note" hint="Only you see this — it is never sent to the client.">
            <TextArea value={form.ownerNote} onChange={e => setForm({ ...form, ownerNote: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gd-text-secondary">
            <input
              type="checkbox"
              checked={form.clientVisible}
              onChange={e => setForm({ ...form, clientVisible: e.target.checked })}
              className="h-4 w-4 accent-gd-accent-500"
            />
            Visible to the client
          </label>

          <ErrorNote>{error}</ErrorNote>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </GhostButton>
            <PrimaryButton onClick={save} loading={saving}>
              {editing ? "Save changes" : "Add milestone"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <DeliverableForm
        milestoneId={deliverableFor}
        onClose={() => setDeliverableFor(null)}
        onSaved={() => {
          setDeliverableFor(null);
          refresh();
        }}
      />
    </div>
  );
}

function DeliverableForm({
  milestoneId,
  onClose,
  onSaved,
}: {
  milestoneId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ title: "", type: "document", description: "", dueDate: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!milestoneId || !form.title.trim()) {
      setError("A deliverable needs a title.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/deliverables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, milestoneId, amount: Number(form.amount) || 0 }),
    });
    if (res.ok) {
      setForm({ title: "", type: "document", description: "", dueDate: "", amount: "" });
      onSaved();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Couldn't add that deliverable.");
    }
    setSaving(false);
  };

  return (
    <Modal open={!!milestoneId} onClose={onClose} title="Add deliverable" wide>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {DELIVERABLE_TYPES.map(t => (
                <option key={t} value={t}>
                  {DELIVERABLE_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <TextInput type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          <Field label="Amount" hint="Used for invoicing later.">
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Description">
          <TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <PrimaryButton onClick={save} loading={saving}>
            Add deliverable
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
