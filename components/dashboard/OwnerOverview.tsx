"use client";
import Link from "next/link";
import {
  Wallet,
  Banknote,
  FolderKanban,
  UserPlus,
  Users,
  Handshake,
  ArrowUpRight,
  Inbox,
  ListChecks,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { RevenueChart } from "./RevenueChart";
import { ProgressBar } from "./kit";
import {
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_VARIANT,
  formatMoney,
  PAYMENT_METHOD_LABEL,
  PROJECT_CATEGORY_LABEL,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_VARIANT,
  type OverviewResponse,
} from "@/lib/agency";

const DEFAULT_CURRENCY = "DZD";

function shortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function OwnerOverview({ data }: { data: OverviewResponse }) {
  const { stats, revenueByMonth, pipeline, recent, projectTable } = data;

  const maxPipeline = Math.max(...pipeline.map(p => p.count), 1);
  const totalPipelineValue = pipeline.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      {/* ── Headline numbers ── */}
      <AnimeWrapper animate="stagger" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Revenue Received"
          value={formatMoney(stats.revenueReceived, DEFAULT_CURRENCY)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(stats.outstanding, DEFAULT_CURRENCY)}
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <StatCard
          label="New Leads · This Month"
          value={stats.newLeadsThisMonth}
          icon={<UserPlus className="h-5 w-5" />}
        />
        <StatCard label="Total Clients" value={stats.totalClients} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active Partners" value={stats.activePartners} icon={<Handshake className="h-5 w-5" />} />
      </AnimeWrapper>

      {/* ── Roadmap-era counters, all real queries ── */}
      <AnimeWrapper animate="stagger" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Projects In Progress"
          value={stats.projectsInProgress ?? 0}
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <StatCard
          label="Milestones Due · 14 Days"
          value={stats.milestonesDueSoon ?? 0}
          icon={<ListChecks className="h-5 w-5" />}
        />
        <StatCard
          label="Orders Awaiting Approval"
          value={stats.ordersAwaitingApproval ?? 0}
          icon={<Inbox className="h-5 w-5" />}
        />
      </AnimeWrapper>

      {/* ── Revenue + pipeline ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <RevenueChart data={revenueByMonth} />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gd-text-primary">Pipeline</h3>
            <span className="text-xs text-gd-text-muted">{formatMoney(totalPipelineValue)}</span>
          </div>
          <div className="space-y-3">
            {pipeline.map(stage => (
              <div key={stage.status}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <Badge variant={stage.variant}>{stage.label}</Badge>
                  </span>
                  <span className="text-gd-text-secondary">
                    {stage.count} · {formatMoney(stage.value)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gd-overlay">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500 transition-all duration-700"
                    style={{ width: `${(stage.count / maxPipeline) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {stats.overdueAmount > 0 && (
            <div className="mt-5 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-3.5 py-3">
              <p className="text-xs font-medium text-gd-danger">
                {formatMoney(stats.overdueAmount)} overdue
              </p>
              <Link
                href="/dashboard/finance"
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-gd-danger/80 hover:text-gd-danger"
              >
                Review overdue invoices <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* ── Recent activity ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gd-text-primary">Latest Payments</h3>
            <Link href="/dashboard/finance" className="text-xs text-gd-accent-400 hover:underline">
              Finance
            </Link>
          </div>
          {recent.payments.length === 0 ? (
            <p className="py-6 text-center text-xs text-gd-text-muted">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.payments.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gd-text-primary">
                      {formatMoney(p.amount, DEFAULT_CURRENCY)}
                    </p>
                    <p className="truncate text-[11px] text-gd-text-muted">
                      {p.client_name || p.project_title || "Unassigned"} ·{" "}
                      {PAYMENT_METHOD_LABEL[p.method] || p.method}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-gd-text-muted">{shortDate(p.received_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gd-text-primary">Latest Projects</h3>
            <Link href="/dashboard/projects" className="text-xs text-gd-accent-400 hover:underline">
              Projects
            </Link>
          </div>
          {recent.projects.length === 0 ? (
            <p className="py-6 text-center text-xs text-gd-text-muted">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.projects.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gd-text-primary">{p.title}</p>
                    <p className="truncate text-[11px] text-gd-text-muted">
                      {p.client_name || "No client"} · {PROJECT_CATEGORY_LABEL[p.category] || p.category}
                    </p>
                  </div>
                  <Badge variant={PROJECT_STATUS_VARIANT[p.status] || "default"}>
                    {PROJECT_STATUS_LABEL[p.status] || p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gd-text-primary">Latest Clients</h3>
            <Link href="/dashboard/clients" className="text-xs text-gd-accent-400 hover:underline">
              Clients
            </Link>
          </div>
          {recent.clients.length === 0 ? (
            <p className="py-6 text-center text-xs text-gd-text-muted">No clients yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.clients.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gd-text-primary">{c.company_name}</p>
                    <p className="truncate text-[11px] text-gd-text-muted">
                      {c.contact_name || c.industry || "—"}
                    </p>
                  </div>
                  <Badge variant={CLIENT_STATUS_VARIANT[c.status] || "default"}>
                    {CLIENT_STATUS_LABEL[c.status] || c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Pipeline table ── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gd-text-primary">Pipeline Summary</h3>
            <p className="mt-0.5 text-xs text-gd-text-muted">Most recent projects and what has been collected</p>
          </div>
          <Link href="/dashboard/projects" className="text-xs text-gd-accent-400 hover:underline">
            View all
          </Link>
        </div>

        {projectTable.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Inbox className="h-6 w-6 text-gd-text-muted" />
            <p className="mt-2 text-sm text-gd-text-muted">No projects yet.</p>
            <Link
              href="/dashboard/projects"
              className="mt-3 text-xs font-medium text-gd-accent-400 hover:underline"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gd-border text-left text-[11px] uppercase tracking-wider text-gd-text-muted">
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Progress</th>
                  <th className="pb-3 text-right font-medium">Value</th>
                  <th className="pb-3 text-right font-medium">Collected</th>
                </tr>
              </thead>
              <tbody>
                {projectTable.map(p => (
                  <tr key={p.id} className="border-b border-gd-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/projects?open=${encodeURIComponent(p.id)}`}
                        className="font-medium text-gd-text-primary hover:text-gd-accent-400"
                      >
                        {p.title}
                      </Link>
                      <p className="text-[11px] text-gd-text-muted">
                        {PROJECT_CATEGORY_LABEL[p.category] || p.category}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-gd-text-secondary">{p.client_name || "—"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={PROJECT_STATUS_VARIANT[p.status] || "default"}>
                        {PROJECT_STATUS_LABEL[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="w-32 py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={p.progress} className="w-16" />
                        <span className="text-[11px] text-gd-text-muted">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-gd-text-secondary">
                      {formatMoney(p.total_amount)}
                    </td>
                    <td className="py-3 text-right font-medium text-gd-text-primary">
                      {formatMoney(p.paid || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
