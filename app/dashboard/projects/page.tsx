"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ArrowUpRight, FolderKanban, Receipt, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OwnerShell, OwnerDenied } from "@/components/dashboard/OwnerShell";
import {
  Modal,
  Field,
  TextInput,
  TextArea,
  Select,
  GhostButton,
  PrimaryButton,
  SearchInput,
  EmptyState,
  ErrorNote,
  InlineSpinner,
  ConfirmDialog,
  ProgressBar,
} from "@/components/dashboard/kit";
import { ownerGet, ownerSend, ownerDelete } from "@/lib/agency-client";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  PAYMENT_METHOD_LABEL,
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_LABEL,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_VARIANT,
  formatMoney,
  type ClientRow,
  type Invoice,
  type Payment,
  type ProjectRow,
} from "@/lib/agency";

interface ProjectForm {
  title: string;
  clientId: string;
  category: string;
  status: string;
  description: string;
  totalAmount: string;
  currency: string;
  depositAmount: string;
  startDate: string;
  dueDate: string;
  progress: number;
}

const EMPTY_FORM: ProjectForm = {
  title: "",
  clientId: "",
  category: "erp",
  status: "lead",
  description: "",
  totalAmount: "",
  currency: "DZD",
  depositAmount: "",
  startDate: "",
  dueDate: "",
  progress: 0,
};

interface ProjectDetail {
  project: ProjectRow & { paid?: number };
  client: ClientRow | null;
  invoices: Invoice[];
  payments: Payment[];
}

export default function ProjectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [denied, setDenied] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [progressDraft, setProgressDraft] = useState<number | null>(null);

  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Loads run inside the effects below, with state set only from promise
  // callbacks — calling a state-setting helper from an effect is what
  // react-hooks/set-state-in-effect flags. `load`/`loadDetail` bump a key
  // that re-runs the fetch instead.
  const [reloadKey, setReloadKey] = useState(0);
  const [detailReloadKey, setDetailReloadKey] = useState(0);

  const load = useCallback(() => setReloadKey(k => k + 1), []);
  const loadDetail = useCallback(() => setDetailReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();

    Promise.all([
      ownerGet<{ projects: ProjectRow[] }>(`/api/projects${qs ? `?${qs}` : ""}`),
      ownerGet<{ clients: ClientRow[] }>("/api/clients"),
    ]).then(([projectsRes, clientsRes]) => {
      if (cancelled) return;
      if (projectsRes.ok) {
        setProjects(projectsRes.data.projects || []);
        setError("");
        setDenied(false);
      } else if (projectsRes.status === 403 || projectsRes.status === 401) {
        setDenied(true);
      } else {
        setError(projectsRes.error);
      }
      if (clientsRes.ok) setClients(clientsRes.data.clients || []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, debouncedSearch, categoryFilter, statusFilter, reloadKey]);

  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;

    ownerGet<ProjectDetail>(`/api/projects/${encodeURIComponent(detailId)}`).then(res => {
      if (cancelled) return;
      if (res.ok) setDetail(res.data);
      else setError(res.error);
      // Drop any half-dragged progress value from a previously opened project.
      setProgressDraft(null);
    });

    return () => {
      cancelled = true;
    };
  }, [detailId, detailReloadKey]);

  // Deep link from the overview table: /dashboard/projects?open=<id>
  // window.location is only readable after mount, and deferring the update
  // keeps the first client render identical to the server's.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("open");
    if (!id) return;
    const timer = setTimeout(() => setDetailId(id), 0);
    return () => clearTimeout(timer);
  }, []);

  /* ── Create / edit ── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (project: ProjectRow) => {
    setEditing(project);
    setForm({
      title: project.title || "",
      clientId: project.client_id || "",
      category: project.category || "other",
      status: project.status || "lead",
      description: project.description || "",
      totalAmount: project.total_amount ? String(project.total_amount) : "",
      currency: project.currency || "DZD",
      depositAmount: project.deposit_amount ? String(project.deposit_amount) : "",
      startDate: project.start_date || "",
      dueDate: project.due_date || "",
      progress: project.progress || 0,
    });
    setFormError("");
    setFormOpen(true);
  };

  const save = async () => {
    if (!userId) return;
    if (!form.title.trim()) {
      setFormError("Project title is required.");
      return;
    }
    setSaving(true);
    setFormError("");

    const payload = {
      title: form.title.trim(),
      clientId: form.clientId,
      category: form.category,
      status: form.status,
      description: form.description,
      totalAmount: Number(form.totalAmount) || 0,
      currency: form.currency || "DZD",
      depositAmount: Number(form.depositAmount) || 0,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progress: form.progress,
    };

    const res = editing
      ? await ownerSend(`/api/projects/${encodeURIComponent(editing.id)}`, "PATCH", payload)
      : await ownerSend("/api/projects", "POST", payload);

    if (res.ok) {
      setFormOpen(false);
      await load();
      if (detailId) await loadDetail();
    } else {
      setFormError(res.error);
    }
    setSaving(false);
  };

  /* ── Inline updates from the detail view ── */
  const patchProject = async (patch: Record<string, unknown>) => {
    if (!userId || !detail) return;
    const res = await ownerSend<{ project: ProjectRow }>(
      `/api/projects/${encodeURIComponent(detail.project.id)}`,
      "PATCH",
      patch
    );
    if (res.ok) {
      setDetail({ ...detail, project: { ...detail.project, ...res.data.project } });
      setProjects(prev => prev.map(p => (p.id === detail.project.id ? { ...p, ...res.data.project } : p)));
    } else {
      setError(res.error);
    }
  };

  const commitProgress = async () => {
    if (progressDraft === null || !detail) return;
    const value = progressDraft;
    setProgressDraft(null);
    if (value === detail.project.progress) return;
    await patchProject({ progress: value });
  };

  const confirmDelete = async () => {
    if (!userId || !pendingDelete) return;
    setDeleteBusy(true);
    const res = await ownerDelete(`/api/projects/${encodeURIComponent(pendingDelete.id)}`);
    if (res.ok) {
      setPendingDelete(null);
      if (detailId === pendingDelete.id) setDetailId(null);
      await load();
    } else {
      setError(res.error);
      setPendingDelete(null);
    }
    setDeleteBusy(false);
  };

  if (isLoading || !user) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" /></div>;
  }

  if (denied) return <OwnerDenied />;

  return (
    <OwnerShell
      title="Projects"
      subtitle="Custom ERP, MES, CRM and platform work — from first lead to delivered."
      actions={
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Project
        </PrimaryButton>
      }
    >
      <ErrorNote>{error}</ErrorNote>

      <Card>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects or clients…" />
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="lg:w-44"
          >
            <option value="">All categories</option>
            {PROJECT_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {PROJECT_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="lg:w-44">
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map(s => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <InlineSpinner label="Loading projects…" />
        ) : projects.length === 0 ? (
          <EmptyState
            title={debouncedSearch || categoryFilter || statusFilter ? "No projects match those filters" : "No projects yet"}
            message={
              debouncedSearch || categoryFilter || statusFilter
                ? "Try a different search term, or clear the filters."
                : "Create your first project and link it to a client."
            }
            action={
              !debouncedSearch && !categoryFilter && !statusFilter ? (
                <PrimaryButton onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New Project
                </PrimaryButton>
              ) : undefined
            }
          />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gd-border text-left text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Progress</th>
                  <th className="pb-3 text-right font-medium">Value</th>
                  <th className="pb-3 text-right font-medium">Collected</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b border-gd-border/60 last:border-0 hover:bg-gd-elevated/30">
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => setDetailId(project.id)}
                        className="text-left font-medium text-gd-text-primary hover:text-gd-accent-400"
                      >
                        {project.title}
                      </button>
                      <p className="text-[11px] text-gd-text-muted">
                        {PROJECT_CATEGORY_LABEL[project.category] || project.category}
                        {project.due_date ? ` · due ${project.due_date}` : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-gd-text-secondary">{project.client_name || "—"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={PROJECT_STATUS_VARIANT[project.status] || "default"}>
                        {PROJECT_STATUS_LABEL[project.status] || project.status}
                      </Badge>
                    </td>
                    <td className="w-32 py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={project.progress} className="w-16" />
                        <span className="text-[11px] text-gd-text-muted">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-gd-text-secondary">
                      {formatMoney(project.total_amount, project.currency)}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-gd-text-primary">
                      {formatMoney(project.paid || 0, project.currency)}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/dashboard/projects/${encodeURIComponent(project.id)}`}
                          className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-accent-400"
                          title="Open workspace"
                        >
                          <FolderKanban className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDetailId(project.id)}
                          className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-text-primary"
                          title="Quick view"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(project)}
                          className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-text-primary"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(project)}
                          className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-danger/10 hover:text-gd-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Create / edit modal ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit project" : "New project"}
        subtitle={editing ? editing.title : "A piece of software you're delivering to a client."}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project title" className="sm:col-span-2">
              <TextInput
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Production planning ERP for Tlemcen Foods"
              />
            </Field>

            <Field label="Client" hint="Leave empty for internal work.">
              <Select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                <option value="">— No client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {PROJECT_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {PROJECT_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {PROJECT_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
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

            <Field label="Total amount">
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={form.totalAmount}
                onChange={e => setForm({ ...form, totalAmount: e.target.value })}
                placeholder="0"
              />
            </Field>

            <Field label="Currency">
              <TextInput
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                placeholder="DZD"
              />
            </Field>

            <Field label="Agreed deposit">
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={form.depositAmount}
                onChange={e => setForm({ ...form, depositAmount: e.target.value })}
                placeholder="0"
              />
            </Field>

            <Field label="Start date">
              <TextInput
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>

            <Field label="Due date">
              <TextInput
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description" hint="Scope, processes, terminology, modules — whatever defines this build.">
            <TextArea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Modules, integrations, shifts, existing systems to replace…"
            />
          </Field>

          <ErrorNote>{formError}</ErrorNote>

          <div className="flex justify-end gap-2 pt-1">
            <GhostButton type="button" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </GhostButton>
            <PrimaryButton type="button" onClick={save} loading={saving}>
              {editing ? "Save changes" : "Create project"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* ── Detail modal ── */}
      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail?.project.title || "Project"}
        subtitle={detail?.client?.company_name || undefined}
        wide
      >
        {!detail || detail.project.id !== detailId ? (
          <InlineSpinner label="Loading project…" />
        ) : (
          <div className="space-y-6">
            {/* Status + progress controls */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="mb-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">Status</p>
                <Select
                  value={detail.project.status}
                  onChange={e => patchProject({ status: e.target.value })}
                >
                  {PROJECT_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">Progress</p>
                  <span className="text-xs font-medium text-gd-accent-400">
                    {progressDraft ?? detail.project.progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressDraft ?? detail.project.progress}
                  onChange={e => setProgressDraft(Number(e.target.value))}
                  onPointerUp={commitProgress}
                  onKeyUp={commitProgress}
                  onBlur={commitProgress}
                  className="w-full accent-gd-accent-500"
                  aria-label="Project progress"
                />
              </div>
            </div>

            {/* Money */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <Wallet className="h-3 w-3" /> Contract
                </p>
                <p className="mt-1 text-lg font-bold text-gd-text-primary">
                  {formatMoney(detail.project.total_amount, detail.project.currency)}
                </p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">Collected</p>
                <p className="mt-1 text-lg font-bold text-gd-accent-400">
                  {formatMoney(detail.project.paid || 0, detail.project.currency)}
                </p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">Remaining</p>
                <p className="mt-1 text-lg font-bold text-gd-text-primary">
                  {formatMoney(
                    Math.max(0, Number(detail.project.total_amount || 0) - Number(detail.project.paid || 0)),
                    detail.project.currency
                  )}
                </p>
              </div>
            </div>

            {detail.project.description && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gd-text-primary">Scope</h3>
                <p className="whitespace-pre-wrap rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5 text-sm text-gd-text-secondary">
                  {detail.project.description}
                </p>
              </div>
            )}

            {/* Invoices */}
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gd-text-primary">
                <Receipt className="h-3.5 w-3.5" /> Invoices
              </h3>
              {detail.invoices.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gd-border-soft p-3.5 text-xs text-gd-text-muted">
                  No invoices raised for this project yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.invoices.map(inv => (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-gd-text-primary">{inv.invoice_number}</p>
                        <p className="text-[11px] text-gd-text-muted">
                          {formatMoney(inv.amount, detail.project.currency)} · paid{" "}
                          {formatMoney(inv.amount_paid, detail.project.currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gd-text-secondary">
                          {formatMoney(inv.balance_due, detail.project.currency)} due
                        </span>
                        <Badge variant={INVOICE_STATUS_VARIANT[inv.status] || "default"}>
                          {INVOICE_STATUS_LABEL[inv.status] || inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gd-text-primary">Payment history</h3>
              {detail.payments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gd-border-soft p-3.5 text-xs text-gd-text-muted">
                  No payments received for this project yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.payments.map(pay => (
                    <div
                      key={pay.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-gd-text-primary">
                          {formatMoney(pay.amount, detail.project.currency)}
                        </p>
                        <p className="text-[11px] text-gd-text-muted">
                          {PAYMENT_METHOD_LABEL[pay.method] || pay.method}
                          {pay.invoice_number ? ` · ${pay.invoice_number}` : ""}
                          {pay.reference ? ` · ${pay.reference}` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] text-gd-text-muted">{pay.received_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gd-border pt-4">
              <GhostButton type="button" onClick={() => setDetailId(null)}>
                Close
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={() => {
                  const project = projects.find(p => p.id === detail.project.id) || detail.project;
                  setDetailId(null);
                  openEdit(project);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit project
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete project?"
        message={
          pendingDelete
            ? `${pendingDelete.title} will be permanently removed. Projects with invoices or payments can't be deleted.`
            : ""
        }
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </OwnerShell>
  );
}
