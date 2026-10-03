import type { Db } from "./db";

/* ────────────────────────────────────────────────────────────────────────
 * Agency domain: clients, projects, invoices, payments, partners.
 * Shared by the owner API routes and the owner dashboard UI so labels,
 * statuses and money maths can never drift apart between the two.
 * ──────────────────────────────────────────────────────────────────────── */

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

/* ── Clients ── */
export const CLIENT_STATUSES = ["lead", "active", "completed", "archived"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

/* ── Projects ── */
export const PROJECT_CATEGORIES = ["erp", "mes", "crm", "web_app", "mobile_app", "platform", "other"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = ["lead", "in_progress", "review", "delivered", "on_hold", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/* ── Invoices ── */
export const INVOICE_STATUSES = ["draft", "sent", "partially_paid", "paid", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/* ── Payments ── */
export const PAYMENT_METHODS = ["bank_transfer", "ccp", "cash", "cheque", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/* ── Partners ── */
export const PARTNER_CATEGORIES = ["technology", "finance", "logistics", "consulting", "reseller", "integration"] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

export const PARTNER_STATUSES = ["active", "negotiating", "past"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

/* ── Human labels ── */
export const CLIENT_STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  in_progress: "In Progress",
  review: "In Review",
  delivered: "Delivered",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

export const PROJECT_CATEGORY_LABEL: Record<string, string> = {
  erp: "ERP",
  mes: "MES",
  crm: "CRM",
  web_app: "Web App",
  mobile_app: "Mobile App",
  platform: "Platform",
  other: "Other",
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  ccp: "CCP",
  cash: "Cash",
  cheque: "Cheque",
  card: "Card",
};

export const PARTNER_CATEGORY_LABEL: Record<string, string> = {
  technology: "Technology",
  finance: "Finance",
  logistics: "Logistics",
  consulting: "Consulting",
  reseller: "Reseller",
  integration: "Integration",
};

export const PARTNER_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  negotiating: "Negotiating",
  past: "Past",
};

/* ── Badge colour mapping ── */
export const CLIENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  lead: "info",
  active: "success",
  completed: "purple",
  archived: "default",
};

export const PROJECT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  lead: "info",
  in_progress: "warning",
  review: "purple",
  delivered: "success",
  on_hold: "default",
  cancelled: "danger",
};

export const INVOICE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  draft: "default",
  sent: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
};

export const PARTNER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: "success",
  negotiating: "warning",
  past: "default",
};

export const PARTNER_CATEGORY_VARIANT: Record<string, BadgeVariant> = {
  technology: "info",
  finance: "success",
  logistics: "warning",
  consulting: "purple",
  reseller: "default",
  integration: "info",
};

/* ── Project orders (§3) ─────────────────────────────────────────────────
 * `project_orders` is deliberately separate from the marketplace `orders`
 * table, which this pivot does not touch.
 * ───────────────────────────────────────────────────────────────────────── */

export const ORDER_STATUSES = [
  "draft",
  "awaiting_account",
  "awaiting_spec",
  "awaiting_confirmation",
  "confirmed",
  "approved",
  "in_production",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  awaiting_account: "Awaiting Account",
  awaiting_spec: "Awaiting Specification",
  awaiting_confirmation: "Awaiting Confirmation",
  confirmed: "Confirmed",
  approved: "Approved",
  in_production: "In Production",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  draft: "default",
  awaiting_account: "info",
  awaiting_spec: "info",
  awaiting_confirmation: "warning",
  confirmed: "warning",
  approved: "success",
  in_production: "success",
  completed: "purple",
  cancelled: "danger",
};

/** How the client chose to describe their project. */
export const CONTACT_PREFERENCES = ["ai_agent", "written_brief", "sales_email", "sales_phone"] as const;
export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];

export const CONTACT_PREFERENCE_LABEL: Record<string, string> = {
  ai_agent: "AI agent interview",
  written_brief: "Written brief",
  sales_email: "Emailed sales",
  sales_phone: "Phone / WhatsApp",
};

export const BUDGET_RANGES = ["under_200k", "200k_500k", "500k_1_5m", "1_5m_5m", "over_5m", "not_sure"] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const BUDGET_RANGE_LABEL: Record<string, string> = {
  under_200k: "Under 200,000 DZD",
  "200k_500k": "200,000 – 500,000 DZD",
  "500k_1_5m": "500,000 – 1,500,000 DZD",
  "1_5m_5m": "1,500,000 – 5,000,000 DZD",
  over_5m: "Over 5,000,000 DZD",
  not_sure: "Not sure yet",
};

/** Modules a client can tick on the written brief (§3.4 B). */
export const SPEC_MODULES = [
  "erp",
  "mes",
  "crm",
  "inventory",
  "accounting",
  "hr",
  "production",
  "reporting",
  "other",
] as const;

export const SPEC_MODULE_LABEL: Record<string, string> = {
  erp: "ERP",
  mes: "MES",
  crm: "CRM",
  inventory: "Inventory",
  accounting: "Accounting",
  hr: "HR",
  production: "Production",
  reporting: "Reporting",
  other: "Other",
};

/* ── Roadmap (§5) ──────────────────────────────────────────────────────── */

export const MILESTONE_PHASES = ["discovery", "design", "development", "testing", "deployment", "handover"] as const;
export type MilestonePhase = (typeof MILESTONE_PHASES)[number];

export const MILESTONE_PHASE_LABEL: Record<string, string> = {
  discovery: "Discovery",
  design: "Design",
  development: "Development",
  testing: "Testing",
  deployment: "Deployment",
  handover: "Handover",
};

export const MILESTONE_STATUSES = ["pending", "in_progress", "review", "completed", "blocked"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  review: "In Review",
  completed: "Completed",
  blocked: "Blocked",
};

export const MILESTONE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "default",
  in_progress: "warning",
  review: "purple",
  completed: "success",
  blocked: "danger",
};

export const DELIVERABLE_TYPES = ["demo", "mvp", "final_product", "document", "training"] as const;
export type DeliverableType = (typeof DELIVERABLE_TYPES)[number];

export const DELIVERABLE_TYPE_LABEL: Record<string, string> = {
  demo: "Demo",
  mvp: "MVP",
  final_product: "Final Product",
  document: "Document",
  training: "Training",
};

export const DELIVERABLE_STATUSES = ["pending", "in_progress", "completed"] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const DELIVERABLE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export const DELIVERABLE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "default",
  in_progress: "warning",
  completed: "success",
};

/** What the client is buying towards (§6.1). */
export const DELIVERY_TARGETS = ["demo", "mvp", "final_product"] as const;
export type DeliveryTarget = (typeof DELIVERY_TARGETS)[number];

export const DELIVERY_TARGET_LABEL: Record<string, string> = {
  demo: "Demo — a working prototype to validate direction",
  mvp: "MVP — the first usable release",
  final_product: "Final product — the complete build",
};

/* ── Design references (§2.2) ──────────────────────────────────────────── */

export const DESIGN_REFERENCE_STATUSES = ["suggested", "agreed", "rejected"] as const;
export type DesignReferenceStatus = (typeof DESIGN_REFERENCE_STATUSES)[number];

export const DESIGN_REFERENCE_STATUS_LABEL: Record<string, string> = {
  suggested: "Suggested",
  agreed: "Agreed",
  rejected: "Rejected",
};

export const DESIGN_REFERENCE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  suggested: "info",
  agreed: "success",
  rejected: "danger",
};

/**
 * Validate a design reference URL.
 *
 * Only absolute `https:` URLs are accepted. `javascript:`, `data:`, relative
 * paths and plain `http:` are all rejected — the value is rendered as an
 * outbound link, so a `javascript:` URL would be script execution.
 */
export function isSafeReferenceUrl(value: string): boolean {
  const raw = str(value);
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/** The starter roadmap seeded when the owner approves an order (§5.3). */
export const STARTER_ROADMAP: { phase: MilestonePhase; title: string; description: string }[] = [
  { phase: "discovery", title: "Discovery", description: "Requirements confirmed, scope agreed." },
  { phase: "design", title: "Design", description: "UI direction and flows approved." },
  { phase: "development", title: "Development", description: "Build in progress." },
  { phase: "testing", title: "Testing", description: "QA and client review." },
  { phase: "deployment", title: "Deployment", description: "Go-live." },
  { phase: "handover", title: "Handover", description: "Documentation and training." },
];

/* ── Small parsing helpers (request bodies are untrusted) ── */
export function str(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

export function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

export function int(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function oneOf<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const v = str(value);
  return (allowed as readonly string[]).includes(v) ? (v as T[number]) : fallback;
}

/* ── Ids & dates ── */
export function genId(prefix: string): string {
  const rand =
    typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${rand}`;
}

/** Today as YYYY-MM-DD (UTC). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-09-30T…" → "2026-09" */
export function monthKey(value: string | null | undefined): string {
  return String(value || "").slice(0, 7);
}

/** The last `n` months as ascending "YYYY-MM" keys, ending with the current month. */
export function lastNMonths(n: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09" → "Sep 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const idx = parseInt(m, 10) - 1;
  if (!y || Number.isNaN(idx) || idx < 0 || idx > 11) return key;
  return `${MONTH_NAMES[idx]} ${y}`;
}

/** First day of the current month, as YYYY-MM-01 (UTC). */
export function startOfMonthISO(from: Date = new Date()): string {
  return `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/* ── Money ── */
export function formatMoney(amount: number, currency = "DZD"): string {
  const n = num(amount);
  const formatted = n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} ${currency}`;
}

export function formatCompact(amount: number): string {
  const n = num(amount);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

/* ── Invoice money logic ──────────────────────────────────────────────────
 * A single source of truth for what an invoice is owed, used by the invoice
 * routes AND the payment routes, so `balance_due` can never disagree with the
 * payments actually recorded against it.
 * ───────────────────────────────────────────────────────────────────────── */

export interface InvoiceRow {
  id: string;
  amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  due_date: string | null;
}

/**
 * The status an invoice should display right now.
 *
 * `overdue` is derived rather than stored: an invoice becomes overdue because
 * time passed, not because someone wrote to the database, so deriving it on
 * read keeps the number honest without a nightly job.
 */
export function effectiveInvoiceStatus(inv: {
  status: string;
  balance_due: number;
  due_date?: string | null;
}): InvoiceStatus {
  const base = str(inv.status, "draft");
  const balance = num(inv.balance_due);

  if (base === "paid" || balance <= 0) return base === "draft" ? "draft" : "paid";
  // Drafts haven't been issued, so they can't be late.
  if (base === "draft") return "draft";

  const due = str(inv.due_date);
  if (due && due < todayISO()) return "overdue";

  return base === "partially_paid" ? "partially_paid" : "sent";
}

/**
 * Recompute an invoice's `amount_paid` and `balance_due` from the payments
 * recorded against it. Call after any payment is added, changed or removed.
 */
export async function recalcInvoice(db: Db, invoiceId: string): Promise<void> {
  const invoice = (await db.prepare("SELECT amount, amount_paid, status FROM invoices WHERE id = ?").get(invoiceId)) as
    | { amount: number; amount_paid: number; status: string }
    | undefined;
  if (!invoice) return;

  const paidRow = (await db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ?")
    .get(invoiceId)) as { total: number } | undefined;

  const amount = num(invoice.amount);
  const paid = num(paidRow?.total);
  // An overpayment leaves nothing owing. The surplus still shows in
  // `amount_paid`, but a negative balance would wrongly shrink the
  // "outstanding" totals, so it floors at zero.
  const balance = Math.max(0, Math.round((amount - paid) * 100) / 100);

  // Keep `draft` sticky — issuing an invoice (draft → sent) is a decision the
  // owner makes by hand, not a side effect of the balance changing.
  let status = str(invoice.status, "draft");
  if (balance <= 0 && amount > 0) status = "paid";
  else if (paid > 0) status = "partially_paid";
  else if (status !== "draft") status = "sent";

  await db
    .prepare("UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ? WHERE id = ?")
    .run(paid, balance, status, invoiceId);
}

/** Serialize a raw invoice row for the client, applying the derived status. */
export function serializeInvoice(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    amount: num(row.amount),
    deposit_received: num(row.deposit_received),
    amount_paid: num(row.amount_paid),
    balance_due: num(row.balance_due),
    status: effectiveInvoiceStatus({
      status: str(row.status, "draft"),
      balance_due: num(row.balance_due),
      due_date: row.due_date as string | null,
    }),
  };
}

/** Next invoice number, e.g. INV-2026-0007. Unique per year. */
export async function nextInvoiceNumber(db: Db): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `INV-${year}-`;
  const row = (await db
    .prepare("SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1")
    .get(`${prefix}%`)) as { invoice_number: string } | undefined;

  const last = row?.invoice_number ? parseInt(row.invoice_number.slice(prefix.length), 10) : 0;
  const next = (Number.isFinite(last) ? last : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/* ────────────────────────────────────────────────────────────────────────
 * Row shapes returned by the owner API — used by the dashboard UI.
 * ──────────────────────────────────────────────────────────────────────── */

export interface ClientRow {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  country: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  project_count?: number;
  project_value?: number;
  total_paid?: number;
}

export interface ProjectRow {
  id: string;
  client_id: string | null;
  title: string;
  category: string;
  description: string | null;
  status: string;
  total_amount: number;
  currency: string;
  deposit_amount: number;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  created_at: string;
  client_name?: string | null;
  paid?: number;
  invoice_count?: number;
}

export interface Invoice {
  id: string;
  project_id: string | null;
  invoice_number: string;
  amount: number;
  deposit_received: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  due_date: string | null;
  issued_at: string | null;
  notes: string | null;
  created_at: string;
  project_title?: string | null;
  client_name?: string | null;
}

export interface Payment {
  id: string;
  invoice_id: string | null;
  project_id: string | null;
  amount: number;
  method: string;
  reference: string | null;
  received_at: string;
  notes: string | null;
  created_at: string;
  project_title?: string | null;
  client_name?: string | null;
  invoice_number?: string | null;
}

export interface PartnerRow {
  id: string;
  name: string;
  logo_url: string | null;
  category: string;
  website: string | null;
  contact_name: string | null;
  email: string | null;
  collaboration_type: string | null;
  description: string | null;
  status: string;
  since: string | null;
  created_at: string;
}

export interface OverviewResponse {
  owner: { name: string; email: string };
  stats: {
    revenueReceived: number;
    outstanding: number;
    overdueAmount: number;
    activeProjects: number;
    newLeadsThisMonth: number;
    totalClients: number;
    activePartners: number;
    projectsInProgress: number;
    milestonesDueSoon: number;
    ordersAwaitingApproval: number;
  };
  revenueByMonth: { month: string; label: string; amount: number }[];
  pipeline: { status: string; label: string; variant: BadgeVariant; count: number; value: number }[];
  recent: { payments: Payment[]; projects: ProjectRow[]; clients: ClientRow[] };
  projectTable: ProjectRow[];
}

/* ────────────────────────────────────────────────────────────────────────
 * Linking a signed-in account to a client / partner record
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Ensure a `clients` row exists for this email, creating a lead if not.
 *
 * Shared by the verification hook and the ordering flow so there is exactly
 * one path that turns a person into a client record. Returns the client id.
 */
export async function ensureClientRecord(
  db: Db,
  account: { name: string; email: string; businessName?: string | null }
): Promise<string> {
  const email = str(account.email).toLowerCase();
  if (!email) throw new Error("Cannot link a client record without an email address.");

  const existing = (await db.prepare("SELECT id FROM clients WHERE LOWER(email) = ?").get(email)) as
    | { id: string }
    | undefined;
  if (existing) return str(existing.id);

  const id = genId("cl");
  await db
    .prepare(
      `INSERT INTO clients
         (id, company_name, contact_name, email, phone, industry, country, notes, status, created_at)
       VALUES (?, ?, ?, ?, '', '', '', '', 'lead', ?)`
    )
    .run(id, str(account.businessName) || str(account.name), str(account.name), email, new Date().toISOString());

  return id;
}

/**
 * Turn a freshly verified account into a record the owner can act on:
 * a `client` signup becomes a lead in the pipeline, a `partner` signup becomes
 * a negotiating partner.
 *
 * Matched on email and therefore idempotent — if the owner has already entered
 * this company by hand, their record is left alone rather than duplicated.
 *
 * Callers should treat this as best-effort: it must never block verification.
 */
export async function linkVerifiedAccount(
  db: Db,
  account: { name: string; email: string; accountType: string; businessName?: string | null }
): Promise<"client" | "partner" | "existing" | "none"> {
  const email = str(account.email).toLowerCase();
  if (!email) return "none";

  const companyName = str(account.businessName) || str(account.name);
  const contactName = str(account.name);
  const now = new Date().toISOString();

  if (account.accountType === "partner") {
    const existing = await db.prepare("SELECT id FROM partners WHERE LOWER(email) = ?").get(email);
    if (existing) return "existing";

    await db
      .prepare(
        `INSERT INTO partners
           (id, name, logo_url, category, website, contact_name, email,
            collaboration_type, description, status, since, created_at)
         VALUES (?, ?, '', 'technology', '', ?, ?, '', '', 'negotiating', '', ?)`
      )
      .run(genId("ptn"), companyName, contactName, email, now);
    return "partner";
  }

  if (account.accountType === "client") {
    const existing = await db.prepare("SELECT id FROM clients WHERE LOWER(email) = ?").get(email);
    await ensureClientRecord(db, account);
    return existing ? "existing" : "client";
  }

  return "none";
}

/**
 * A `project_specs` row for display, with the JSON list columns decoded.
 *
 * Malformed JSON yields an empty list rather than throwing — a bad row must
 * not take down the owner's dashboard or the client's portal.
 */export function parseSpecRow(row: Record<string, unknown>): Record<string, unknown> {  const list = (value: unknown): string[] => {
    try {
      const parsed = JSON.parse(String(value ?? "[]"));
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  };

  return {
    ...row,
    required_modules: list(row.required_modules),
    roles: list(row.roles),
    integrations: list(row.integrations),
    languages: list(row.languages),
  };
}

/**
 * The project row, but only if `email` is the client it belongs to.
 *
 * Ownership is decided by the JOIN, not by the caller — a guessed project id
 * simply matches nothing, so every client-facing route can rely on a
 * non-empty result meaning "yes, this is theirs".
 */
export async function findOwnedProject(
  db: Db,
  projectId: string,
  email: string
): Promise<Record<string, unknown> | undefined> {
  return (await db
    .prepare(
      `SELECT p.*
         FROM projects p
         JOIN clients c ON c.id = p.client_id
        WHERE p.id = ? AND LOWER(c.email) = ?`
    )
    .get(projectId, str(email).toLowerCase())) as Record<string, unknown> | undefined;
}
