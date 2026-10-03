import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import {
  effectiveInvoiceStatus,
  lastNMonths,
  monthKey,
  monthLabel,
  num,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_VARIANT,
  startOfMonthISO,
} from "@/lib/agency";

/**
 * GET /api/dashboard/overview?userId=…
 *
 * Everything the owner's Overview page renders, in one round trip: headline
 * stats, the 12-month received-revenue series, the project pipeline, a recent
 * activity feed and the pipeline table.
 *
 * Owner-only — authorized server-side by `requireOwner`.
 */

/** How "Active Projects" is counted: work currently underway. */
const ACTIVE_PROJECT_STATUSES = ["in_progress", "review"];
const REVENUE_MONTHS = 12;

export async function GET(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const one = async (sql: string, ...args: unknown[]): Promise<number> => {
      const row = (await db.prepare(sql).get(...args)) as { c?: number } | undefined;
      return num(row?.c);
    };

    const monthStart = startOfMonthISO();
    const activePlaceholders = ACTIVE_PROJECT_STATUSES.map(() => "?").join(", ");
    const sinceMonth = lastNMonths(REVENUE_MONTHS)[0];

    /* ── Headline stats (all real aggregates) ── */
    const [
      revenueReceived,
      outstanding,
      activeProjects,
      newLeadsThisMonth,
      totalClients,
      activePartners,
    ] = await Promise.all([
      one("SELECT COALESCE(SUM(amount), 0) AS c FROM payments"),
      // Drafts haven't been issued yet, so they aren't money owed.
      one("SELECT COALESCE(SUM(balance_due), 0) AS c FROM invoices WHERE status <> 'draft'"),
      one(`SELECT COUNT(*) AS c FROM projects WHERE status IN (${activePlaceholders})`, ...ACTIVE_PROJECT_STATUSES),
      one("SELECT COUNT(*) AS c FROM clients WHERE status = 'lead' AND created_at >= ?", monthStart),
      one("SELECT COUNT(*) AS c FROM clients"),
      one("SELECT COUNT(*) AS c FROM partners WHERE status = 'active'"),
    ]);

    /* ── Pipeline counters for the roadmap era (§5.6) ── */
    const [projectsInProgress, milestonesDueSoon, ordersAwaitingApproval] = await Promise.all([
      one("SELECT COUNT(*) AS c FROM projects WHERE status = 'in_progress'"),
      // Due within a fortnight and not yet done. Milestones with no due date
      // are excluded rather than treated as overdue.
      one(
        `SELECT COUNT(*) AS c FROM project_milestones
          WHERE status <> 'completed'
            AND due_date IS NOT NULL AND due_date <> ''
            AND due_date <= date('now', '+14 days')`
      ),
      one("SELECT COUNT(*) AS c FROM project_orders WHERE status IN ('confirmed','awaiting_confirmation')"),
    ]);

    /* ── Revenue received by month (last 12 months) ── */
    const revenueRows = (await db
      .prepare(
        `SELECT substr(received_at, 1, 7) AS m, COALESCE(SUM(amount), 0) AS total
           FROM payments
          WHERE received_at >= ?
          GROUP BY m`
      )
      .all(sinceMonth)) as { m: string; total: number }[];

    const revenueByMonthMap = new Map<string, number>();
    for (const row of revenueRows) revenueByMonthMap.set(monthKey(row.m), num(row.total));

    const revenueByMonth = lastNMonths(REVENUE_MONTHS).map(key => ({
      month: key,
      label: monthLabel(key),
      amount: revenueByMonthMap.get(key) ?? 0,
    }));

    /* ── Pipeline by project status ── */
    const pipelineRows = (await db
      .prepare(
        `SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS value
           FROM projects
          GROUP BY status`
      )
      .all()) as { status: string; count: number; value: number }[];

    // Keep the canonical status order, and include statuses with no projects
    // so the breakdown reads as a complete pipeline rather than a partial one.
    const pipelineByStatus = new Map(pipelineRows.map(r => [r.status, r]));
    const pipeline = Object.keys(PROJECT_STATUS_LABEL).map(status => {
      const row = pipelineByStatus.get(status);
      return {
        status,
        label: PROJECT_STATUS_LABEL[status],
        variant: PROJECT_STATUS_VARIANT[status],
        count: num(row?.count),
        value: num(row?.value),
      };
    });

    /* ── Recent activity ── */
    const recentPayments = (await db
      .prepare(
        `SELECT p.id, p.amount, p.method, p.reference, p.received_at,
                pr.title AS project_title, c.company_name AS client_name
           FROM payments p
           LEFT JOIN projects pr ON pr.id = p.project_id
           LEFT JOIN clients  c  ON c.id  = pr.client_id
          ORDER BY p.received_at DESC, p.created_at DESC
          LIMIT 5`
      )
      .all()) as Record<string, unknown>[];

    const recentProjects = (await db
      .prepare(
        `SELECT pr.id, pr.title, pr.category, pr.status, pr.progress,
                pr.total_amount, pr.currency, pr.created_at,
                c.company_name AS client_name
           FROM projects pr
           LEFT JOIN clients c ON c.id = pr.client_id
          ORDER BY pr.created_at DESC
          LIMIT 5`
      )
      .all()) as Record<string, unknown>[];

    const recentClients = (await db
      .prepare(
        `SELECT id, company_name, contact_name, industry, status, created_at
           FROM clients
          ORDER BY created_at DESC
          LIMIT 5`
      )
      .all()) as Record<string, unknown>[];

    /* ── Pipeline table: live projects with what's actually been collected ── */
    const projectTable = (await db
      .prepare(
        `SELECT pr.id, pr.title, pr.category, pr.status, pr.progress,
                pr.total_amount, pr.currency, pr.due_date,
                c.company_name AS client_name,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE project_id = pr.id) AS paid
           FROM projects pr
           LEFT JOIN clients c ON c.id = pr.client_id
          ORDER BY pr.created_at DESC
          LIMIT 10`
      )
      .all()) as Record<string, unknown>[];

    /* ── Overdue, surfaced on the overview too ── */
    const invoiceRows = (await db
      .prepare("SELECT id, status, balance_due, due_date FROM invoices")
      .all()) as Record<string, unknown>[];
    const overdueAmount = invoiceRows
      .filter(inv =>
        effectiveInvoiceStatus({
          status: String(inv.status ?? "draft"),
          balance_due: num(inv.balance_due),
          due_date: inv.due_date as string | null,
        }) === "overdue"
      )
      .reduce((sum, inv) => sum + num(inv.balance_due), 0);

    return NextResponse.json({
      owner: { name: auth.owner.name, email: auth.owner.email },
      stats: {
        revenueReceived,
        outstanding,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        activeProjects,
        newLeadsThisMonth,
        totalClients,
        activePartners,
        projectsInProgress,
        milestonesDueSoon,
        ordersAwaitingApproval,
      },
      revenueByMonth,
      pipeline,
      recent: {
        payments: recentPayments,
        projects: recentProjects,
        clients: recentClients,
      },
      projectTable,
    });
  } catch (err) {
    return serverError("dashboard/overview", err);
  }
}
