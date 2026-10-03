import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { genId, INVOICE_STATUSES, nextInvoiceNumber, num, serializeInvoice, str } from "@/lib/agency";

/**
 * GET  /api/invoices?userId=…&status=…&projectId=…&clientId=…
 * POST /api/invoices
 *
 * Owner-only. `balance_due` is always derived from `amount` minus the payments
 * actually recorded, never taken from the request body.
 */

export async function GET(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = str(searchParams.get("status"));
    const projectId = str(searchParams.get("projectId"));
    const clientId = str(searchParams.get("clientId"));

    const where: string[] = [];
    const args: unknown[] = [];
    if (projectId) {
      where.push("i.project_id = ?");
      args.push(projectId);
    }
    if (clientId) {
      where.push("p.client_id = ?");
      args.push(clientId);
    }

    const db = await getDb();
    let invoices = (await db
      .prepare(
        `SELECT i.*, p.title AS project_title, c.company_name AS client_name
           FROM invoices i
           LEFT JOIN projects p ON p.id = i.project_id
           LEFT JOIN clients  c ON c.id = p.client_id
           ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
          ORDER BY i.created_at DESC`
      )
      .all(...args)) as Record<string, unknown>[];

    let serialized = invoices.map(serializeInvoice);

    // `overdue` is derived from the due date, so this filter runs after
    // serialization rather than in SQL.
    if (status && (INVOICE_STATUSES as readonly string[]).includes(status)) {
      serialized = serialized.filter(i => i.status === status);
    }

    return NextResponse.json({ invoices: serialized });
  } catch (err) {
    return serverError("invoices GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();

    const amount = Math.max(0, num(body.amount));
    if (amount <= 0) {
      return NextResponse.json({ error: "Invoice amount must be greater than zero." }, { status: 400 });
    }

    const projectId = str(body.projectId);
    if (projectId) {
      const project = await db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
      if (!project) return NextResponse.json({ error: "That project no longer exists." }, { status: 400 });
    }

    // Either an explicit number or the next one in the sequence.
    let invoiceNumber = str(body.invoiceNumber);
    if (!invoiceNumber) {
      invoiceNumber = await nextInvoiceNumber(db);
    } else {
      const clash = await db.prepare("SELECT id FROM invoices WHERE invoice_number = ?").get(invoiceNumber);
      if (clash) {
        return NextResponse.json({ error: `Invoice number "${invoiceNumber}" is already in use.` }, { status: 409 });
      }
    }

    const status = str(body.status, "draft");
    const issuedAt = str(body.issuedAt) || (status !== "draft" ? new Date().toISOString() : "");

    const id = genId("inv");
    await db
      .prepare(
        `INSERT INTO invoices
           (id, project_id, invoice_number, amount, deposit_received, amount_paid,
            balance_due, status, due_date, issued_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        projectId || null,
        invoiceNumber,
        amount,
        Math.max(0, num(body.depositReceived)),
        amount,
        (INVOICE_STATUSES as readonly string[]).includes(status) ? status : "draft",
        str(body.dueDate),
        issuedAt,
        str(body.notes),
        new Date().toISOString()
      );

    const created = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    return NextResponse.json({ invoice: serializeInvoice(created as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    return serverError("invoices POST", err);
  }
}
