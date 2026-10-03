import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { genId, num, oneOf, PAYMENT_METHODS, recalcInvoice, str, todayISO } from "@/lib/agency";

/**
 * GET  /api/payments?userId=…&invoiceId=…&projectId=…&clientId=…
 * POST /api/payments   → record a payment / deposit
 *
 * Owner-only. Recording a payment recomputes the linked invoice's paid and
 * balance figures straight away, so the invoice list is never stale.
 */

export async function GET(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const invoiceId = str(searchParams.get("invoiceId"));
    const projectId = str(searchParams.get("projectId"));
    const clientId = str(searchParams.get("clientId"));

    const where: string[] = [];
    const args: unknown[] = [];
    if (invoiceId) {
      where.push("pay.invoice_id = ?");
      args.push(invoiceId);
    }
    if (projectId) {
      where.push("pay.project_id = ?");
      args.push(projectId);
    }
    if (clientId) {
      where.push("p.client_id = ?");
      args.push(clientId);
    }

    const db = await getDb();
    const payments = (await db
      .prepare(
        `SELECT pay.*, p.title AS project_title, c.company_name AS client_name,
                i.invoice_number
           FROM payments pay
           LEFT JOIN projects p ON p.id = pay.project_id
           LEFT JOIN clients  c ON c.id = p.client_id
           LEFT JOIN invoices i ON i.id = pay.invoice_id
           ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
          ORDER BY pay.received_at DESC, pay.created_at DESC`
      )
      .all(...args)) as Record<string, unknown>[];

    return NextResponse.json({ payments: payments.map(p => ({ ...p, amount: num(p.amount) })) });
  } catch (err) {
    return serverError("payments GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const amount = num(body.amount);
    if (!(amount > 0)) {
      return NextResponse.json({ error: "Payment amount must be greater than zero." }, { status: 400 });
    }

    const db = await getDb();

    let invoiceId = str(body.invoiceId);
    let projectId = str(body.projectId);

    // An invoice already knows its project — use that unless told otherwise.
    if (invoiceId) {
      const invoice = (await db.prepare("SELECT id, project_id FROM invoices WHERE id = ?").get(invoiceId)) as
        | { id: string; project_id: string | null }
        | undefined;
      if (!invoice) return NextResponse.json({ error: "That invoice no longer exists." }, { status: 400 });
      if (!projectId && invoice.project_id) projectId = str(invoice.project_id);
    }

    if (projectId) {
      const project = await db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
      if (!project) return NextResponse.json({ error: "That project no longer exists." }, { status: 400 });
    }

    const id = genId("pay");
    await db
      .prepare(
        `INSERT INTO payments
           (id, invoice_id, project_id, amount, method, reference, received_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        invoiceId || null,
        projectId || null,
        amount,
        oneOf(body.method, PAYMENT_METHODS, "bank_transfer"),
        str(body.reference),
        str(body.receivedAt) || todayISO(),
        str(body.notes),
        new Date().toISOString()
      );

    if (invoiceId) await recalcInvoice(db, invoiceId);

    const payment = await db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    return serverError("payments POST", err);
  }
}
