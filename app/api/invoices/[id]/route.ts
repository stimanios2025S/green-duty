import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { INVOICE_STATUSES, num, recalcInvoice, serializeInvoice, str } from "@/lib/agency";

/**
 * GET    /api/invoices/:id?userId=…  → invoice + project + client + payments
 * PATCH  /api/invoices/:id           → update, or {"action":"mark_sent"|"mark_draft"}
 * DELETE /api/invoices/:id           → delete, only when it has no payments
 *
 * Owner-only. After any change to `amount`, the paid/balance figures are
 * recomputed from the payments table so they can't drift.
 */

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const db = await getDb();

    const invoice = (await db.prepare("SELECT * FROM invoices WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    const project = invoice.project_id
      ? ((await db.prepare("SELECT * FROM projects WHERE id = ?").get(invoice.project_id)) as
          | Record<string, unknown>
          | undefined)
      : undefined;

    const client = project?.client_id
      ? ((await db.prepare("SELECT * FROM clients WHERE id = ?").get(project.client_id)) as
          | Record<string, unknown>
          | undefined)
      : undefined;

    const payments = (await db
      .prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY received_at DESC, created_at DESC")
      .all(id)) as Record<string, unknown>[];

    return NextResponse.json({
      invoice: serializeInvoice(invoice),
      project: project ?? null,
      client: client ?? null,
      payments,
    });
  } catch (err) {
    return serverError("invoices/[id] GET", err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const existing = (await db.prepare("SELECT * FROM invoices WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    const action = str(body.action);

    /* ── Issue / un-issue shortcuts ── */
    if (action === "mark_sent" || action === "mark_draft") {
      const status = action === "mark_sent" ? "sent" : "draft";
      const issuedAt =
        action === "mark_sent" ? str(existing.issued_at) || new Date().toISOString() : str(existing.issued_at);
      await db.prepare("UPDATE invoices SET status = ?, issued_at = ? WHERE id = ?").run(status, issuedAt, id);
      await recalcInvoice(db, id);
      const updated = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
      return NextResponse.json({ invoice: serializeInvoice(updated as Record<string, unknown>) });
    }

    /* ── Field updates ── */
    const amount = body.amount === undefined ? num(existing.amount) : Math.max(0, num(body.amount));
    if (amount <= 0) {
      return NextResponse.json({ error: "Invoice amount must be greater than zero." }, { status: 400 });
    }

    let invoiceNumber = body.invoiceNumber === undefined ? str(existing.invoice_number) : str(body.invoiceNumber);
    if (!invoiceNumber) invoiceNumber = str(existing.invoice_number);
    if (invoiceNumber !== str(existing.invoice_number)) {
      const clash = await db
        .prepare("SELECT id FROM invoices WHERE invoice_number = ? AND id <> ?")
        .get(invoiceNumber, id);
      if (clash) {
        return NextResponse.json({ error: `Invoice number "${invoiceNumber}" is already in use.` }, { status: 409 });
      }
    }

    let status = body.status === undefined ? str(existing.status, "draft") : str(body.status);
    if (!(INVOICE_STATUSES as readonly string[]).includes(status)) status = str(existing.status, "draft");

    let projectId = body.projectId === undefined ? str(existing.project_id) : str(body.projectId);
    if (projectId) {
      const project = await db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
      if (!project) return NextResponse.json({ error: "That project no longer exists." }, { status: 400 });
    } else {
      projectId = "";
    }

    await db
      .prepare(
        `UPDATE invoices
            SET project_id = ?, invoice_number = ?, amount = ?, deposit_received = ?,
                status = ?, due_date = ?, notes = ?
          WHERE id = ?`
      )
      .run(
        projectId || null,
        invoiceNumber,
        amount,
        body.depositReceived === undefined ? num(existing.deposit_received) : Math.max(0, num(body.depositReceived)),
        status,
        body.dueDate === undefined ? str(existing.due_date) : str(body.dueDate),
        body.notes === undefined ? str(existing.notes) : str(body.notes),
        id
      );

    await recalcInvoice(db, id);
    const updated = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    return NextResponse.json({ invoice: serializeInvoice(updated as Record<string, unknown>) });
  } catch (err) {
    return serverError("invoices/[id] PATCH", err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const invoice = await db.prepare("SELECT id FROM invoices WHERE id = ?").get(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    // Payments are financial records — never silently detach them.
    const payments = (await db.prepare("SELECT COUNT(*) AS c FROM payments WHERE invoice_id = ?").get(id)) as {
      c: number;
    };
    if (num(payments?.c) > 0) {
      return NextResponse.json(
        { error: `This invoice has ${num(payments.c)} payment(s) recorded against it. Remove those first.` },
        { status: 409 }
      );
    }

    await db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("invoices/[id] DELETE", err);
  }
}
