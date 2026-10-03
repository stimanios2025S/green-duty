"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Globe, Mail, Handshake } from "lucide-react";
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
} from "@/components/dashboard/kit";
import { ownerGet, ownerSend, ownerDelete } from "@/lib/agency-client";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_STATUSES,
  PARTNER_STATUS_LABEL,
  PARTNER_STATUS_VARIANT,
  type PartnerRow,
} from "@/lib/agency";

interface PartnerForm {
  name: string;
  logoUrl: string;
  category: string;
  website: string;
  contactName: string;
  email: string;
  collaborationType: string;
  description: string;
  status: string;
  since: string;
}

const EMPTY_FORM: PartnerForm = {
  name: "",
  logoUrl: "",
  category: "technology",
  website: "",
  contactName: "",
  email: "",
  collaborationType: "",
  description: "",
  status: "active",
  since: "",
};

export default function PartnersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [denied, setDenied] = useState(false);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerRow | null>(null);
  const [form, setForm] = useState<PartnerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [pendingDelete, setPendingDelete] = useState<PartnerRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Loads run inside the effect below, with state set only from promise
  // callbacks — calling a state-setting helper from an effect is what
  // react-hooks/set-state-in-effect flags. `load` bumps a key instead.
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey(k => k + 1), []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();

    ownerGet<{ partners: PartnerRow[] }>(`/api/partners${qs ? `?${qs}` : ""}`).then(res => {
      if (cancelled) return;
      if (res.ok) {
        setPartners(res.data.partners || []);
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
  }, [userId, debouncedSearch, categoryFilter, statusFilter, reloadKey]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (partner: PartnerRow) => {
    setEditing(partner);
    setForm({
      name: partner.name || "",
      logoUrl: partner.logo_url || "",
      category: partner.category || "technology",
      website: partner.website || "",
      contactName: partner.contact_name || "",
      email: partner.email || "",
      collaborationType: partner.collaboration_type || "",
      description: partner.description || "",
      status: partner.status || "active",
      since: partner.since || "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const save = async () => {
    if (!userId) return;
    if (!form.name.trim()) {
      setFormError("Partner name is required.");
      return;
    }
    setSaving(true);
    setFormError("");

    const res = editing
      ? await ownerSend(`/api/partners/${encodeURIComponent(editing.id)}`, "PATCH", { ...form })
      : await ownerSend("/api/partners", "POST", { ...form });

    if (res.ok) {
      setFormOpen(false);
      await load();
    } else {
      setFormError(res.error);
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!userId || !pendingDelete) return;
    setDeleteBusy(true);
    const res = await ownerDelete(`/api/partners/${encodeURIComponent(pendingDelete.id)}`);
    if (res.ok) {
      setPendingDelete(null);
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

  const filtered = debouncedSearch || categoryFilter || statusFilter;

  return (
    <OwnerShell
      title="Partners"
      subtitle="The companies you build with, resell through, or integrate with."
      actions={
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Partner
        </PrimaryButton>
      }
    >
      <ErrorNote>{error}</ErrorNote>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search partners, contacts, emails…" />
          <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="lg:w-44">
            <option value="">All categories</option>
            {PARTNER_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {PARTNER_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="lg:w-40">
            <option value="">All statuses</option>
            {PARTNER_STATUSES.map(s => (
              <option key={s} value={s}>
                {PARTNER_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <Card>
          <InlineSpinner label="Loading partners…" />
        </Card>
      ) : partners.length === 0 ? (
        <EmptyState
          title={filtered ? "No partners match those filters" : "No partners yet"}
          message={
            filtered
              ? "Try a different search term, or clear the filters."
              : "Add the technology vendors, integrators and resellers you work with."
          }
          action={
            !filtered ? (
              <PrimaryButton onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New Partner
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {partners.map(partner => (
            <Card key={partner.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gd-border bg-gd-elevated text-gd-accent-400">
                    {partner.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Handshake className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gd-text-primary">{partner.name}</p>
                    <p className="truncate text-[11px] text-gd-text-muted">
                      {PARTNER_CATEGORY_LABEL[partner.category] || partner.category}
                      {partner.since ? ` · since ${partner.since}` : ""}
                    </p>
                  </div>
                </div>
                <Badge variant={PARTNER_STATUS_VARIANT[partner.status] || "default"}>
                  {PARTNER_STATUS_LABEL[partner.status] || partner.status}
                </Badge>
              </div>

              {partner.description && (
                <p className="mt-3 line-clamp-3 text-xs text-gd-text-secondary">{partner.description}</p>
              )}

              {partner.collaboration_type && (
                <p className="mt-3 rounded-lg border border-gd-border bg-gd-elevated/40 px-2.5 py-1.5 text-[11px] text-gd-text-muted">
                  {partner.collaboration_type}
                </p>
              )}

              <div className="mt-3 space-y-1 text-[11px] text-gd-text-muted">
                {partner.contact_name && <p>{partner.contact_name}</p>}
                {partner.email && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <a href={`mailto:${partner.email}`} className="truncate hover:text-gd-accent-400">
                      {partner.email}
                    </a>
                  </p>
                )}
                {partner.website && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Globe className="h-3 w-3 flex-shrink-0" />
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-gd-accent-400"
                    >
                      {partner.website.replace(/^https?:\/\//, "")}
                    </a>
                  </p>
                )}
              </div>

              <div className="mt-auto flex justify-end gap-1 border-t border-gd-border pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(partner)}
                  className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-text-primary"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(partner)}
                  className="rounded-lg p-2 text-gd-text-muted transition-colors hover:bg-gd-danger/10 hover:text-gd-danger"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit partner" : "New partner"}
        subtitle={editing ? editing.name : "A company you collaborate with."}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <TextInput
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Atlas Cloud Systems"
              />
            </Field>

            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {PARTNER_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {PARTNER_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {PARTNER_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {PARTNER_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Contact name">
              <TextInput
                value={form.contactName}
                onChange={e => setForm({ ...form, contactName: e.target.value })}
                placeholder="e.g. Sara Haddad"
              />
            </Field>

            <Field label="Email">
              <TextInput
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="partner@company.com"
              />
            </Field>

            <Field label="Website">
              <TextInput
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                placeholder="https://…"
              />
            </Field>

            <Field label="Logo URL">
              <TextInput
                value={form.logoUrl}
                onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://…/logo.png"
              />
            </Field>

            <Field label="Collaboration type">
              <TextInput
                value={form.collaborationType}
                onChange={e => setForm({ ...form, collaborationType: e.target.value })}
                placeholder="e.g. Joint ERP delivery"
              />
            </Field>

            <Field label="Partner since">
              <TextInput
                value={form.since}
                onChange={e => setForm({ ...form, since: e.target.value })}
                placeholder="e.g. 2024"
              />
            </Field>
          </div>

          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What you do together, and why it matters…"
            />
          </Field>

          <ErrorNote>{formError}</ErrorNote>

          <div className="flex justify-end gap-2 pt-1">
            <GhostButton type="button" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </GhostButton>
            <PrimaryButton type="button" onClick={save} loading={saving}>
              {editing ? "Save changes" : "Create partner"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete partner?"
        message={pendingDelete ? `${pendingDelete.name} will be permanently removed.` : ""}
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </OwnerShell>
  );
}
