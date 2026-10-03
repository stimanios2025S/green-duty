"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Building2, Mail, Phone, ArrowUpRight } from "lucide-react";
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
  CLIENT_STATUS_LABEL,
  CLIENT_STATUSES,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  PAYMENT_METHOD_LABEL,
  PROJECT_CATEGORY_LABEL,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_VARIANT,
  formatMoney,
  type ClientRow,
  type Invoice,
  type Payment,
  type ProjectRow,
} from "@/lib/agency";

interface ClientForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  country: string;
  notes: string;
  status: string;
}

const EMPTY_FORM: ClientForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  industry: "",
  country: "",
  notes: "",
  status: "lead",
};

interface ClientDetail {
  client: ClientRow;
  projects: ProjectRow[];
  invoices: Invoice[];
  payments: Payment[];
}

export default function ClientsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [denied, setDenied] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);

  const [pendingDelete, setPendingDelete] = useState<ClientRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Data loads inside the effect, with state set only from promise callbacks.
  // Calling a state-setting helper directly from an effect is what
  // react-hooks/set-state-in-effect flags, so `load`/`loadDetail` just bump a
  // key that re-runs the fetch instead.
  const [reloadKey, setReloadKey] = useState(0);
  const [detailReloadKey, setDetailReloadKey] = useState(0);

  const load = useCallback(() => setReloadKey(k => k + 1), []);
  const loadDetail = useCallback(() => setDetailReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();

    ownerGet<{ clients: ClientRow[] }>(`/api/clients${qs ? `?${qs}` : ""}`).then(res => {
      if (cancelled) return;
      if (res.ok) {
        setClients(res.data.clients || []);
        setError("");
        setDenied(false);
      } else if (res.status === 403 || res.status === 401) {
        setDenied(true);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, debouncedSearch, statusFilter, reloadKey]);

  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;

    ownerGet<ClientDetail>(`/api/clients/${encodeURIComponent(detailId)}`).then(res => {
      if (cancelled) return;
      if (res.ok) setDetail(res.data);
      else setError(res.error);
    });

    return () => {
      cancelled = true;
    };
  }, [detailId, detailReloadKey]);

  /* ── Create / edit ── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (client: ClientRow) => {
    setEditing(client);
    setForm({
      companyName: client.company_name || "",
      contactName: client.contact_name || "",
      email: client.email || "",
      phone: client.phone || "",
      industry: client.industry || "",
      country: client.country || "",
      notes: client.notes || "",
      status: client.status || "lead",
    });
    setFormError("");
    setFormOpen(true);
  };

  const save = async () => {
    if (!userId) return;
    if (!form.companyName.trim()) {
      setFormError("Company name is required.");
      return;
    }
    setSaving(true);
    setFormError("");

    const res = editing
      ? await ownerSend(`/api/clients/${encodeURIComponent(editing.id)}`, "PATCH", { ...form })
      : await ownerSend("/api/clients", "POST", { ...form });

    if (res.ok) {
      setFormOpen(false);
      await load();
      if (detailId) await loadDetail();
    } else {
      setFormError(res.error);
    }
    setSaving(false);
  };

  /* ── Status change straight from the row ── */
  const changeStatus = async (client: ClientRow, status: string) => {
    if (!userId || status === client.status) return;
    const res = await ownerSend(`/api/clients/${encodeURIComponent(client.id)}`, "PATCH", { status });
    if (res.ok) {
      setClients(prev => prev.map(c => (c.id === client.id ? { ...c, status } : c)));
      if (detail?.client.id === client.id) setDetail({ ...detail, client: { ...detail.client, status } });
    } else {
      setError(res.error);
    }
  };

  const confirmDelete = async () => {
    if (!userId || !pendingDelete) return;
    setDeleteBusy(true);
    const res = await ownerDelete(`/api/clients/${encodeURIComponent(pendingDelete.id)}`);
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
      title="Clients"
      subtitle="Every business you build for — factories, retailers, institutions and partners."
      actions={
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Client
        </PrimaryButton>
      }
    >
      <ErrorNote>{error}</ErrorNote>

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search company, contact, email…" />
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="sm:w-48"
          >
            <option value="">All statuses</option>
            {CLIENT_STATUSES.map(s => (
              <option key={s} value={s}>
                {CLIENT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <InlineSpinner label="Loading clients…" />
        ) : clients.length === 0 ? (
          <EmptyState
            title={debouncedSearch || statusFilter ? "No clients match those filters" : "No clients yet"}
            message={
              debouncedSearch || statusFilter
                ? "Try a different search term or clear the status filter."
                : "Add your first B2B client to start tracking projects, invoices and payments."
            }
            action={
              !debouncedSearch && !statusFilter ? (
                <PrimaryButton onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New Client
                </PrimaryButton>
              ) : undefined
            }
          />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-gd-border text-left text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Contact</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Projects</th>
                  <th className="pb-3 text-right font-medium">Value</th>
                  <th className="pb-3 text-right font-medium">Collected</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="border-b border-gd-border/60 last:border-0 hover:bg-gd-elevated/30">
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => setDetailId(client.id)}
                        className="text-left font-medium text-gd-text-primary hover:text-gd-accent-400"
                      >
                        {client.company_name}
                      </button>
                      <p className="text-[11px] text-gd-text-muted">
                        {[client.industry, client.country].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gd-text-secondary">{client.contact_name || "—"}</p>
                      <p className="text-[11px] text-gd-text-muted">{client.email || "—"}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Select
                        value={client.status}
                        onChange={e => changeStatus(client, e.target.value)}
                        className="w-32 px-2 py-1 text-xs"
                        aria-label={`Status for ${client.company_name}`}
                      >
                        {CLIENT_STATUSES.map(s => (
                          <option key={s} value={s}>
                            {CLIENT_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-3 pr-4 text-right text-gd-text-secondary">{client.project_count ?? 0}</td>
                    <td className="py-3 pr-4 text-right text-gd-text-secondary">
                      {formatMoney(client.project_value || 0)}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-gd-text-primary">
                      {formatMoney(client.total_paid || 0)}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailId(client.id)}
                          className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-text-primary"
                          title="View details"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(client)}
                          className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-text-primary"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(client)}
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
        title={editing ? "Edit client" : "New client"}
        subtitle={editing ? editing.company_name : "Add a business you're building for."}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" className="sm:col-span-2">
              <TextInput
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Groupe Industriel Tlemcen"
              />
            </Field>
            <Field label="Contact name">
              <TextInput
                value={form.contactName}
                onChange={e => setForm({ ...form, contactName: e.target.value })}
                placeholder="e.g. Amine Belkacem"
              />
            </Field>
            <Field label="Email">
              <TextInput
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="contact@company.com"
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+213 …"
              />
            </Field>
            <Field label="Industry">
              <TextInput
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
                placeholder="e.g. Food processing"
              />
            </Field>
            <Field label="Country">
              <TextInput
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                placeholder="e.g. Algeria"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {CLIENT_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {CLIENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Notes" hint="Processes, terminology, key contacts, anything worth remembering.">
            <TextArea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Production lines, shift structure, existing systems…"
            />
          </Field>

          <ErrorNote>{formError}</ErrorNote>

          <div className="flex justify-end gap-2 pt-1">
            <GhostButton type="button" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </GhostButton>
            <PrimaryButton type="button" onClick={save} loading={saving}>
              {editing ? "Save changes" : "Create client"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* ── Detail modal ── */}
      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail?.client.company_name || "Client"}
        subtitle={detail ? [detail.client.industry, detail.client.country].filter(Boolean).join(" · ") : undefined}
        wide
      >
        {!detail || detail.client.id !== detailId ? (
          <InlineSpinner label="Loading client…" />
        ) : (
          <div className="space-y-6">
            {/* Contact block */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <Building2 className="h-3 w-3" /> Contact
                </p>
                <p className="mt-1 text-sm text-gd-text-primary">{detail.client.contact_name || "—"}</p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="mt-1 truncate text-sm text-gd-text-primary">{detail.client.email || "—"}</p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="mt-1 text-sm text-gd-text-primary">{detail.client.phone || "—"}</p>
              </div>
            </div>

            {/* Totals */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">Projects</p>
                <p className="mt-1 text-lg font-bold text-gd-text-primary">{detail.projects.length}</p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">Contract value</p>
                <p className="mt-1 text-lg font-bold text-gd-text-primary">
                  {formatMoney(detail.projects.reduce((s, p) => s + Number(p.total_amount || 0), 0))}
                </p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">Collected</p>
                <p className="mt-1 text-lg font-bold text-gd-accent-400">
                  {formatMoney(detail.payments.reduce((s, p) => s + Number(p.amount || 0), 0))}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gd-text-primary">Notes</h3>
              {detail.client.notes ? (
                <p className="whitespace-pre-wrap rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5 text-sm text-gd-text-secondary">
                  {detail.client.notes}
                </p>
              ) : (
                <p className="rounded-xl border border-dashed border-gd-border-soft p-3.5 text-xs text-gd-text-muted">
                  No notes yet.
                </p>
              )}
            </div>

            {/* Projects */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gd-text-primary">Projects</h3>
              {detail.projects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gd-border-soft p-3.5 text-xs text-gd-text-muted">
                  No projects for this client yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.projects.map(p => (
                    <div key={p.id} className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gd-text-primary">{p.title}</p>
                        <Badge variant={PROJECT_STATUS_VARIANT[p.status] || "default"}>
                          {PROJECT_STATUS_LABEL[p.status] || p.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-gd-text-muted">
                        <span>{PROJECT_CATEGORY_LABEL[p.category] || p.category}</span>
                        <span>
                          {formatMoney(p.total_amount, p.currency)} · collected {formatMoney(p.paid || 0, p.currency)}
                        </span>
                      </div>
                      <ProgressBar value={p.progress} className="mt-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gd-text-primary">Invoices</h3>
              {detail.invoices.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gd-border-soft p-3.5 text-xs text-gd-text-muted">
                  No invoices raised for this client.
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
                          {inv.project_title || "No project"}
                          {inv.due_date ? ` · due ${inv.due_date}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gd-text-secondary">
                          {formatMoney(inv.balance_due)} due
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
              <h3 className="mb-2 text-sm font-semibold text-gd-text-primary">Payments</h3>
              {detail.payments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gd-border-soft p-3.5 text-xs text-gd-text-muted">
                  No payments received from this client yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.payments.map(pay => (
                    <div
                      key={pay.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-gd-text-primary">{formatMoney(pay.amount)}</p>
                        <p className="text-[11px] text-gd-text-muted">
                          {PAYMENT_METHOD_LABEL[pay.method] || pay.method}
                          {pay.reference ? ` · ${pay.reference}` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] text-gd-text-muted">{pay.received_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete client?"
        message={
          pendingDelete
            ? `${pendingDelete.company_name} will be permanently removed. Clients with projects can't be deleted — archive them instead.`
            : ""
        }
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </OwnerShell>
  );
}
