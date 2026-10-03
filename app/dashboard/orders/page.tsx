"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, Inbox, Mail, Phone, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OwnerShell, OwnerDenied } from "@/components/dashboard/OwnerShell";
import { Modal, Field, Select, PrimaryButton, GhostButton, ErrorNote, InlineSpinner } from "@/components/dashboard/kit";
import { ownerGet, ownerSend } from "@/lib/agency-client";
import {
  BUDGET_RANGE_LABEL,
  CONTACT_PREFERENCE_LABEL,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VARIANT,
  SPEC_MODULE_LABEL,
} from "@/lib/agency";
import { DESIGN_STYLES } from "@/lib/catalog-data";

/**
 * The incoming order queue — the lead has to be visible to the owner.
 *
 * Owner-only: /api/project-orders resolves the caller from the session and
 * confirms the OWNER_EMAIL match server-side.
 */

interface OrderRow {
  id: string;
  offering_name: string | null;
  category: string | null;
  status: string;
  budget_range: string | null;
  contact_preference: string | null;
  design_style: string | null;
  owner_notes: string | null;
  created_at: string;
  client_company: string | null;
  client_contact: string | null;
  client_email: string | null;
}

interface SpecRow {
  id: string;
  business_type: string | null;
  industry: string | null;
  company_size: string | null;
  current_process: string | null;
  pain_points: string | null;
  required_modules: string[];
  languages: string[];
  integrations: string[];
  deadline: string | null;
  budget_range: string | null;
  full_summary: string | null;
  status: string;
}

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [denied, setDenied] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ order: OrderRow; spec: SpecRow | null } | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // State is set only from the promise callback; the effect itself stays free
  // of synchronous updates (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const params = new URLSearchParams();
    if (debounced) params.set("search", debounced);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();

    ownerGet<{ orders: OrderRow[] }>(`/api/project-orders${qs ? `?${qs}` : ""}`).then(res => {
      if (cancelled) return;
      if (res.ok) {
        setOrders(res.data.orders || []);
        setDenied(false);
        setError("");
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
  }, [userId, debounced, statusFilter, reloadKey]);

  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;

    ownerGet<{ order: OrderRow; spec: SpecRow | null }>(
      `/api/project-orders/${encodeURIComponent(detailId)}`
    ).then(res => {
      if (cancelled) return;
      if (res.ok) {
        setDetail({ order: res.data.order, spec: res.data.spec });
        setNotes(res.data.order.owner_notes || "");
      } else {
        setError(res.error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const refresh = useCallback(() => setReloadKey(k => k + 1), []);

  const approve = async () => {
    if (!detail) return;
    setSaving(true);
    const res = await ownerSend(`/api/project-orders/${encodeURIComponent(detail.order.id)}`, "PATCH", {
      status: "approved",
      ownerNotes: notes,
    });
    if (res.ok) {
      setDetailId(null);
      refresh();
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  const saveNotes = async () => {
    if (!detail) return;
    setSaving(true);
    const res = await ownerSend(`/api/project-orders/${encodeURIComponent(detail.order.id)}`, "PATCH", {
      ownerNotes: notes,
    });
    if (res.ok) {
      refresh();
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (denied) return <OwnerDenied />;

  const styleName = (id: string | null) => DESIGN_STYLES.find(s => s.id === id)?.name || "—";

  return (
    <OwnerShell
      title="Orders"
      subtitle="Requests coming in from the catalogue, and where each one stands."
    >
      <ErrorNote>{error}</ErrorNote>

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search client or offering…"
              className="w-full rounded-xl border border-gd-border bg-gd-base py-2.5 pl-10 pr-3.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/50"
            />
          </div>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:w-56">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map(s => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <InlineSpinner label="Loading orders…" />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <Inbox className="h-6 w-6 text-gd-text-muted" />
            <p className="mt-2 text-sm text-gd-text-muted">
              {debounced || statusFilter ? "No orders match those filters." : "No orders yet."}
            </p>
          </div>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[940px] text-sm">
              <thead>
                <tr className="border-b border-gd-border text-left text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Offering</th>
                  <th className="pb-3 font-medium">Design</th>
                  <th className="pb-3 font-medium">Budget</th>
                  <th className="pb-3 font-medium">Contact via</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr
                    key={o.id}
                    onClick={() => setDetailId(o.id)}
                    className="cursor-pointer border-b border-gd-border/60 last:border-0 hover:bg-gd-elevated/30"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gd-text-primary">{o.client_company || "—"}</p>
                      <p className="text-[11px] text-gd-text-muted">{o.client_contact || o.client_email || "—"}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gd-text-secondary">{o.offering_name || "—"}</p>
                      <p className="font-mono text-[11px] text-gd-text-muted">{o.id}</p>
                    </td>
                    <td className="py-3 pr-4 text-gd-text-secondary">{styleName(o.design_style)}</td>
                    <td className="py-3 pr-4 text-gd-text-secondary">
                      {BUDGET_RANGE_LABEL[o.budget_range || ""] || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gd-text-secondary">
                      {CONTACT_PREFERENCE_LABEL[o.contact_preference || ""] || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={ORDER_STATUS_VARIANT[o.status] || "default"}>
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-[11px] text-gd-text-muted">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Detail ── */}
      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail?.order.offering_name || "Order"}
        subtitle={detail ? `Order ${detail.order.id}` : undefined}
        wide
      >
        {!detail ? (
          <InlineSpinner label="Loading order…" />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <Building2 className="h-3 w-3" /> Client
                </p>
                <p className="mt-1 text-sm text-gd-text-primary">{detail.order.client_company || "—"}</p>
                <p className="text-[11px] text-gd-text-muted">{detail.order.client_contact || "—"}</p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="mt-1 truncate text-sm text-gd-text-primary">{detail.order.client_email || "—"}</p>
              </div>
              <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="mt-1 text-sm text-gd-text-primary">—</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Meta label="Status" value={ORDER_STATUS_LABEL[detail.order.status] || detail.order.status} />
              <Meta label="Design direction" value={styleName(detail.order.design_style)} />
              <Meta label="Budget" value={BUDGET_RANGE_LABEL[detail.order.budget_range || ""] || "—"} />
              <Meta label="Contact via" value={CONTACT_PREFERENCE_LABEL[detail.order.contact_preference || ""] || "—"} />
            </div>

            {/* Spec */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gd-text-primary">Specification</h3>
              {!detail.spec ? (
                <p className="rounded-xl border border-dashed border-gd-border-soft p-3.5 text-xs text-gd-text-muted">
                  No written specification yet — this client chose to make contact directly, or it hasn&apos;t been
                  written up.
                </p>
              ) : (
                <div className="space-y-2 rounded-xl border border-gd-border bg-gd-elevated/40 p-4 text-sm">
                  <SpecRow label="Business type" value={detail.spec.business_type} />
                  <SpecRow label="Industry" value={detail.spec.industry} />
                  <SpecRow label="Users" value={detail.spec.company_size} />
                  <SpecRow label="How they work today" value={detail.spec.current_process} />
                  <SpecRow label="Main problem" value={detail.spec.pain_points} />
                  <SpecRow label="Deadline" value={detail.spec.deadline} />
                  {detail.spec.required_modules.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] uppercase tracking-wider text-gd-text-muted">Modules</span>
                      {detail.spec.required_modules.map(m => (
                        <Badge key={m}>{SPEC_MODULE_LABEL[m] || m}</Badge>
                      ))}
                    </div>
                  )}
                  {detail.spec.full_summary && (
                    <p className="whitespace-pre-wrap border-t border-gd-border pt-3 text-xs text-gd-text-secondary">
                      {detail.spec.full_summary}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Field label="Internal notes" hint="Only you see this.">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-gd-border bg-gd-base px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/50"
                placeholder="Call notes, pricing thoughts, anything worth remembering…"
              />
            </Field>

            {/* Approval */}
            <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-gd-text-primary">
                <BadgeCheck className="h-4 w-4 text-gd-accent-400" /> Approve project &amp; start
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gd-text-muted">
                This records your decision and moves the order to <strong>Approved</strong>. Creating the project
                record and its roadmap arrives in the next part — nothing half-built is created here.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <PrimaryButton onClick={approve} loading={saving} disabled={detail.order.status === "approved"}>
                  {detail.order.status === "approved" ? "Already approved" : "Approve & record decision"}
                </PrimaryButton>
                <GhostButton onClick={saveNotes} disabled={saving}>
                  Save notes only
                </GhostButton>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </OwnerShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gd-text-muted">{label}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-gd-text-primary">{value}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <span className="w-40 flex-shrink-0 text-[11px] uppercase tracking-wider text-gd-text-muted">{label}</span>
      <span className="flex-1 whitespace-pre-wrap text-xs text-gd-text-secondary">{value}</span>
    </div>
  );
}
