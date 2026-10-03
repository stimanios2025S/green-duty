"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, FolderKanban, ListChecks, Palette } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { ProgressBar } from "@/components/dashboard/kit";
import { SpecPanel } from "@/components/projects/SpecPanel";
import { DesignDirection } from "@/components/projects/DesignDirection";
import { Roadmap } from "@/components/projects/Roadmap";
import {
  formatMoney,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  PAYMENT_METHOD_LABEL,
  PROJECT_CATEGORY_LABEL,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_VARIANT,
} from "@/lib/agency";
import { cn } from "@/lib/utils";

/**
 * One of the client's own projects.
 *
 * Scoped server-side by /api/portal/projects/[id], which resolves ownership
 * with a JOIN on the caller's own client record — a guessed id returns 404.
 * No internal amounts and no owner notes are ever sent to this page.
 *
 * There is no Download PDF action yet: §4.4 is not built, and the brief is
 * explicit that a button which does nothing must not be rendered.
 */

type Tab = "overview" | "spec" | "design" | "roadmap";

interface ProjectView {
  project: {
    id: string;
    title: string;
    category: string;
    description: string;
    status: string;
    progress: number;
    start_date: string;
    due_date: string;
    currency: string;
  };
  spec: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  designStyle: string | null;
  offeringName: string | null;
}

export default function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<ProjectView | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const userId = user?.id;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetch(`/api/portal/projects/${encodeURIComponent(id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, id]);

  if (isLoading || !user || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <h1 className="font-semibold text-gd-text-primary">Project not found</h1>
        <p className="mt-1 text-sm text-gd-text-secondary">
          This project doesn&apos;t belong to your account, or it no longer exists.
        </p>
        <Link href="/portal" className="mt-4 inline-block text-sm text-gd-accent-400 hover:underline">
          Back to my portal
        </Link>
      </Card>
    );
  }

  const p = data.project;
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <FolderKanban className="h-3.5 w-3.5" /> },
    { key: "spec", label: "Specification", icon: <FileText className="h-3.5 w-3.5" /> },
    { key: "design", label: "Design direction", icon: <Palette className="h-3.5 w-3.5" /> },
    { key: "roadmap", label: "Roadmap", icon: <ListChecks className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 text-sm text-gd-text-secondary transition-colors hover:text-gd-text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> My portal
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gd-text-primary">{p.title}</h1>
          <p className="mt-1 text-sm text-gd-text-secondary">
            {data.offeringName ? `${data.offeringName} · ` : ""}
            {PROJECT_CATEGORY_LABEL[p.category] || p.category}
          </p>
        </div>
        <Badge variant={PROJECT_STATUS_VARIANT[p.status] || "default"}>
          {PROJECT_STATUS_LABEL[p.status] || p.status}
        </Badge>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gd-border bg-gd-card p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === t.key
                ? "bg-gradient-to-r from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400 glow-ring"
                : "text-gd-text-secondary hover:bg-gd-elevated hover:text-gd-text-primary"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gd-text-secondary">Progress</span>
              <span className="font-medium text-gd-text-primary">{p.progress}%</span>
            </div>
            <ProgressBar value={p.progress} className="mt-2" />
            {p.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gd-text-secondary">
                {p.description}
              </p>
            )}
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Meta label="Start date" value={p.start_date || "—"} />
            <Meta label="Due date" value={p.due_date || "—"} />
            <Meta label="Currency" value={p.currency} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-semibold text-gd-text-primary">Invoices</h3>
              {data.invoices.length === 0 ? (
                <p className="py-6 text-center text-sm text-gd-text-muted">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.invoices.map(inv => (
                    <div
                      key={String(inv.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gd-border bg-gd-elevated/50 px-3.5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gd-text-primary">{String(inv.invoice_number)}</p>
                        <p className="text-[11px] text-gd-text-muted">
                          {inv.due_date ? `Due ${String(inv.due_date)}` : "No due date"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gd-text-primary">
                          {formatMoney(Number(inv.balance_due || 0), p.currency)} due
                        </p>
                        <Badge variant={INVOICE_STATUS_VARIANT[String(inv.status)] || "default"}>
                          {INVOICE_STATUS_LABEL[String(inv.status)] || String(inv.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-3 font-semibold text-gd-text-primary">Payments received</h3>
              {data.payments.length === 0 ? (
                <p className="py-6 text-center text-sm text-gd-text-muted">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.payments.map(pay => (
                    <div
                      key={String(pay.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gd-border bg-gd-elevated/50 px-3.5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gd-text-primary">
                          {formatMoney(Number(pay.amount || 0), p.currency)}
                        </p>
                        <p className="text-[11px] text-gd-text-muted">
                          {PAYMENT_METHOD_LABEL[String(pay.method)] || String(pay.method)}
                        </p>
                      </div>
                      <span className="text-[11px] text-gd-text-muted">{String(pay.received_at || "")}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "spec" && <SpecPanel spec={data.spec as never} heading="Your specification" />}

      {tab === "design" && <DesignDirection projectId={id} owner={false} designStyle={data.designStyle} />}

      {tab === "roadmap" && <Roadmap projectId={id} owner={false} />}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
      <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-gd-text-primary">{value}</p>
    </div>
  );
}
