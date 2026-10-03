"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Boxes,
  Briefcase,
  FileText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/dashboard/kit";
import { OfferingIcon } from "@/components/catalog/OfferingIcon";
import { OrderButton } from "@/components/catalog/OrderButton";
import { useAuth } from "@/lib/auth-context";
import { CATALOG_OFFERINGS } from "@/lib/catalog-data";
import {
  formatMoney,
  INVOICE_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PROJECT_CATEGORY_LABEL,
  PROJECT_STATUS_LABEL,
} from "@/lib/agency";

/**
 * The client's home: what we hold on their account and their real projects,
 * invoices and payments.
 *
 * Every figure comes from /api/portal, which resolves the caller from the
 * signed session cookie and scopes the query to that caller's own client
 * record. Nothing here sends an identifier the client could tamper with.
 */

export interface PortalProject {
  id: string;
  title: string;
  category: string;
  status: string;
  total_amount: number;
  currency: string;
  due_date: string | null;
  progress: number;
}

export interface PortalInvoice {
  id: string;
  invoice_number: string;
  project_title: string | null;
  amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  due_date: string | null;
}

export interface PortalPayment {
  id: string;
  amount: number;
  method: string;
  invoice_number: string | null;
  received_at: string;
}

export interface PortalOrder {
  id: string;
  offering_name: string | null;
  category: string | null;
  status: string;
  design_style: string | null;
  budget_range: string | null;
  contact_preference: string | null;
  created_at: string;
}

export interface PortalData {
  role: "client" | "partner" | "none";
  client: { company_name?: string; industry?: string; country?: string; status?: string } | null;
  projects: PortalProject[];
  invoices: PortalInvoice[];
  payments: PortalPayment[];
  orders: PortalOrder[];
  summary: { contractValue: number; invoiced: number; paid: number; outstanding: number };
}

const currencyOf = (projects: PortalProject[]) => projects[0]?.currency || "DZD";

export function statusChipClass(status: string): string {
  switch (status) {
    case "delivered":
    case "paid":
    case "completed":
    case "active":
      return "border-gd-success/20 bg-gd-success/10 text-gd-success";
    case "in_progress":
    case "review":
    case "partially_paid":
      return "border-gd-warning/20 bg-gd-warning/10 text-gd-warning";
    case "overdue":
    case "cancelled":
      return "border-gd-danger/20 bg-gd-danger/10 text-gd-danger";
    case "lead":
    case "sent":
      return "border-gd-info/20 bg-gd-info/10 text-gd-info";
    default:
      return "border-gd-border bg-gd-elevated text-gd-text-secondary";
  }
}

export function ClientPortal({ partner = false }: { partner?: boolean }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // No identifier is sent: the server resolves the caller from the session.
    fetch("/api/portal")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d) setPortal(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!user) return null;

  const company = user.businessProfile;
  const joined = new Date(user.joinedAt);
  const joinedLabel = Number.isNaN(joined.getTime())
    ? "—"
    : joined.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const details = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Account type", value: partner ? "Partner" : "Client / Company" },
    { label: "Member since", value: joinedLabel },
  ];

  const hasWork = !!portal && portal.role === "client";
  const currency = portal ? currencyOf(portal.projects) : "DZD";
  const visibleInvoices = portal?.invoices.filter(inv => inv.status !== "draft") ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHead icon={<ShieldCheck className="h-4 w-4" />} title="Your account" sub="The details we hold for you" />
          <div className="grid gap-4 sm:grid-cols-2">
            {details.map(d => (
              <div key={d.label} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-4">
                <p className="text-xs uppercase tracking-wider text-gd-text-muted">{d.label}</p>
                <p className="mt-1 truncate font-semibold text-gd-text-primary">{d.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-gd-border bg-gd-elevated/50 p-4">
            <p className="text-xs uppercase tracking-wider text-gd-text-muted">Company</p>
            {company?.businessName ? (
              <>
                <p className="mt-1 font-semibold text-gd-text-primary">{company.businessName}</p>
                {company.businessAddress && (
                  <p className="mt-0.5 text-xs text-gd-text-muted">{company.businessAddress}</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-xs text-gd-text-muted">
                No company details yet — you can add them in{" "}
                <Link href="/settings" className="text-gd-accent-400 hover:underline">
                  Settings
                </Link>
                .
              </p>
            )}
          </div>
        </Card>

        <Card>
          <SectionHead
            icon={<Briefcase className="h-4 w-4" />}
            title={partner ? "Work with us" : "Start a project"}
            sub={partner ? "Collaborate on client work" : "Tell us what you need built"}
          />
          <p className="text-sm leading-relaxed text-gd-text-secondary">
            {partner
              ? "Tell us what your company does and how you'd like to collaborate on client projects."
              : "Describe your processes, your terminology and the systems you want to replace, and we'll come back with a plan."}
          </p>
          <Link
            href="/b2b"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
          >
            {partner ? "Propose a collaboration" : "Start a project inquiry"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>

      {loading ? (
        <Card>
          <p className="py-8 text-center text-sm text-gd-text-muted">Loading your projects…</p>
        </Card>
      ) : (
        <>
          {/* ── Orders — shown whether or not a client record exists yet ── */}
          <Card>
            <SectionHead
              icon={<FileText className="h-4 w-4" />}
              title="My orders"
              sub="Requests you've placed with us and where each one stands"
            />
            {!portal || portal.orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-gd-text-muted">
                You haven&apos;t placed an order yet. Pick what you need below and we&apos;ll take it from there.
              </p>
            ) : (
              <div className="space-y-2">
                {portal.orders.map(order => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gd-text-primary">
                        {order.offering_name || "Order"}
                      </p>
                      <p className="text-[11px] text-gd-text-muted">
                        <span className="font-mono">{order.id}</span>
                        {order.design_style ? ` · ${order.design_style.replace(/-/g, " ")}` : ""} ·{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusChipClass(order.status)}`}
                    >
                      {ORDER_STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── What we build, each with a working Order action ── */}
          <Card>
            <SectionHead icon={<Boxes className="h-4 w-4" />} title="Start something new" sub="Order what you need, or ask us first" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATALOG_OFFERINGS.map(offering => (
                <div
                  key={offering.id}
                  className="flex flex-col rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gd-accent-500/10 bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400">
                      <OfferingIcon icon={offering.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gd-text-primary">{offering.name}</p>
                      <p className="truncate text-[11px] text-gd-text-muted">{offering.tagline}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-gd-border pt-2.5">
                    <span className="text-[11px] text-gd-text-muted">{offering.timeline}</span>
                    <OrderButton offeringId={offering.id} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {hasWork && portal ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Contract Value" value={formatMoney(portal.summary.contractValue, currency)} icon={<Wallet className="h-5 w-5" />} />
            <StatCard label="Invoiced" value={formatMoney(portal.summary.invoiced, currency)} icon={<FileText className="h-5 w-5" />} />
            <StatCard label="Paid" value={formatMoney(portal.summary.paid, currency)} icon={<BadgeCheck className="h-5 w-5" />} />
            <StatCard label="Outstanding" value={formatMoney(portal.summary.outstanding, currency)} icon={<Banknote className="h-5 w-5" />} />
          </div>

          <Card>
            <SectionHead icon={<Briefcase className="h-4 w-4" />} title="Your projects" sub="Work we're delivering for you" />
            {portal.projects.length === 0 ? (
              <p className="py-8 text-center text-sm text-gd-text-muted">
                No projects have been created for your account yet.
              </p>
            ) : (
              <div className="space-y-3">
                {portal.projects.map(p => (
                  <Link
                    key={p.id}
                    href={`/portal/projects/${encodeURIComponent(p.id)}`}
                    className="block rounded-xl border border-gd-border bg-gd-elevated/50 p-4 transition-colors hover:border-gd-border-strong hover:bg-gd-elevated"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-gd-text-primary">{p.title}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusChipClass(p.status)}`}>
                        {PROJECT_STATUS_LABEL[p.status] || p.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gd-text-muted">
                      {PROJECT_CATEGORY_LABEL[p.category] || p.category}
                      {p.due_date ? ` · due ${p.due_date}` : ""} · {formatMoney(p.total_amount, p.currency)}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={p.progress} className="flex-1" />
                      <span className="text-[11px] text-gd-text-muted">{p.progress}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <SectionHead icon={<FileText className="h-4 w-4" />} title="Invoices" />
              {visibleInvoices.length === 0 ? (
                <p className="py-8 text-center text-sm text-gd-text-muted">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {visibleInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gd-border bg-gd-elevated/50 px-3.5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gd-text-primary">{inv.invoice_number}</p>
                        <p className="text-[11px] text-gd-text-muted">
                          {inv.project_title || "—"}
                          {inv.due_date ? ` · due ${inv.due_date}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gd-text-primary">{formatMoney(inv.balance_due, currency)} due</p>
                        <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusChipClass(inv.status)}`}>
                          {INVOICE_STATUS_LABEL[inv.status] || inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionHead icon={<BadgeCheck className="h-4 w-4" />} title="Payments received" />
              {portal.payments.length === 0 ? (
                <p className="py-8 text-center text-sm text-gd-text-muted">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {portal.payments.map(pay => (
                    <div
                      key={pay.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gd-border bg-gd-elevated/50 px-3.5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gd-text-primary">{formatMoney(pay.amount, currency)}</p>
                        <p className="text-[11px] text-gd-text-muted">
                          {PAYMENT_METHOD_LABEL[pay.method] || pay.method}
                          {pay.invoice_number ? ` · ${pay.invoice_number}` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] text-gd-text-muted">{pay.received_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gd-accent-500/10 bg-gd-accent-500/10 text-gd-accent-400">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-gd-text-primary">{title}</h3>
        {sub && <p className="text-xs text-gd-text-muted">{sub}</p>}
      </div>
    </div>
  );
}
