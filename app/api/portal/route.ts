import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { num, serializeInvoice, str } from "@/lib/agency";
import { getSession } from "@/lib/session";

/**
 * GET /api/portal
 *
 * What the signed-in client or partner is allowed to see about their own
 * engagement with the agency.
 *
 * ── Scoping ───────────────────────────────────────────────────────────────
 * The identity comes from the signed session cookie, and the client/partner
 * record is resolved from *that account's own email*. There is deliberately no
 * `userId` / `clientId` input: a caller cannot ask for somebody else's
 * projects by changing a value in the URL or body.
 *
 * The owner is a different matter entirely — they read /api/dashboard/*, which
 * is gated by `requireOwner`.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const db = await getDb();
    const user = (await db.prepare("SELECT id, name, email, account_type FROM users WHERE id = ?").get(session.userId)) as
      | { id: string; name: string; email: string; account_type: string }
      | undefined;
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    // Prefer the stored address; fall back to the cookie's claim.
    const email = str(user.email || session.email).toLowerCase();

    const client = (await db.prepare("SELECT * FROM clients WHERE LOWER(email) = ?").get(email)) as
      | Record<string, unknown>
      | undefined;
    const partner = (await db.prepare("SELECT * FROM partners WHERE LOWER(email) = ?").get(email)) as
      | Record<string, unknown>
      | undefined;

    // A partner who is not also a client has no project history to show.
    if (!client) {
      return NextResponse.json({
        role: partner ? "partner" : "none",
        client: null,
        partner: partner ?? null,
        projects: [],
        invoices: [],
        payments: [],
        orders: [],
        summary: { contractValue: 0, invoiced: 0, paid: 0, outstanding: 0 },
      });
    }

    const clientId = str(client.id);

    const projects = (await db
      .prepare(
        `SELECT id, title, category, description, status, total_amount, currency,
                start_date, due_date, progress, created_at
           FROM projects
          WHERE client_id = ?
          ORDER BY created_at DESC`
      )
      .all(clientId)) as Record<string, unknown>[];

    const invoices = (await db
      .prepare(
        `SELECT i.*, p.title AS project_title
           FROM invoices i
           LEFT JOIN projects p ON p.id = i.project_id
          WHERE p.client_id = ?
          ORDER BY i.created_at DESC`
      )
      .all(clientId)) as Record<string, unknown>[];

    const payments = (await db
      .prepare(
        `SELECT pay.id, pay.amount, pay.method, pay.reference, pay.received_at,
                p.title AS project_title, i.invoice_number
           FROM payments pay
           LEFT JOIN projects p ON p.id = pay.project_id
           LEFT JOIN invoices i ON i.id = pay.invoice_id
          WHERE p.client_id = ?
          ORDER BY pay.received_at DESC`
      )
      .all(clientId)) as Record<string, unknown>[];

    const serializedInvoices = invoices.map(serializeInvoice);

    // The client's own orders. Scoped by client_id resolved from the session,
    // so another client's orders cannot be reached from here.
    const orders = (await db
      .prepare(
        `SELECT id, offering_name, category, status, design_style, budget_range,
                contact_preference, created_at
           FROM project_orders
          WHERE client_id = ?
          ORDER BY created_at DESC`
      )
      .all(clientId)) as Record<string, unknown>[];
    // The client sees only what they owe — not the owner's internal notes.
    const totalInvoiced = serializedInvoices.reduce((s, i) => s + num(i.amount), 0);
    const outstanding = serializedInvoices
      .filter(i => i.status !== "draft")
      .reduce((s, i) => s + num(i.balance_due), 0);

    return NextResponse.json({
      role: "client",
      client: {
        id: clientId,
        company_name: str(client.company_name),
        contact_name: str(client.contact_name),
        industry: str(client.industry),
        country: str(client.country),
        status: str(client.status),
        created_at: str(client.created_at),
      },
      partner: partner ?? null,
      projects: projects.map(p => ({ ...p, total_amount: num(p.total_amount), progress: num(p.progress) })),
      invoices: serializedInvoices,
      payments: payments.map(p => ({ ...p, amount: num(p.amount) })),
      orders,
      summary: {
        contractValue: projects.reduce((s, p) => s + num(p.total_amount), 0),
        invoiced: totalInvoiced,
        paid: payments.reduce((s, p) => s + num(p.amount), 0),
        outstanding: Math.round(outstanding * 100) / 100,
      },
    });
  } catch (err) {
    console.error("[portal]", err);
    return NextResponse.json({ error: "Failed to load your portal." }, { status: 500 });
  }
}
