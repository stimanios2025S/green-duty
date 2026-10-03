import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { CLIENT_STATUSES, num, oneOf, serializeInvoice, str } from "@/lib/agency";

/**
 * GET    /api/clients/:id?userId=…  → client + its projects, invoices, payments
 * PATCH  /api/clients/:id           → update (including status changes)
 * DELETE /api/clients/:id           → delete, only when it has no projects
 *
 * Owner-only.
 */

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const db = await getDb();

    const client = (await db.prepare("SELECT * FROM clients WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

    const projects = (await db
      .prepare(
        `SELECT p.*,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE project_id = p.id) AS paid
           FROM projects p
          WHERE p.client_id = ?
          ORDER BY p.created_at DESC`
      )
      .all(id)) as Record<string, unknown>[];

    const invoices = (await db
      .prepare(
        `SELECT i.*, p.title AS project_title
           FROM invoices i
           LEFT JOIN projects p ON p.id = i.project_id
          WHERE p.client_id = ?
          ORDER BY i.created_at DESC`
      )
      .all(id)) as Record<string, unknown>[];

    const payments = (await db
      .prepare(
        `SELECT pay.*, p.title AS project_title, i.invoice_number
           FROM payments pay
           LEFT JOIN projects p ON p.id = pay.project_id
           LEFT JOIN invoices i ON i.id = pay.invoice_id
          WHERE p.client_id = ?
          ORDER BY pay.received_at DESC, pay.created_at DESC`
      )
      .all(id)) as Record<string, unknown>[];

    return NextResponse.json({
      client: {
        ...client,
        project_value: projects.reduce((s, p) => s + num(p.total_amount), 0),
        total_paid: payments.reduce((s, p) => s + num(p.amount), 0),
      },
      projects,
      invoices: invoices.map(serializeInvoice),
      payments,
    });
  } catch (err) {
    return serverError("clients/[id] GET", err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const existing = (await db.prepare("SELECT * FROM clients WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Client not found." }, { status: 404 });

    const companyName = body.companyName === undefined ? str(existing.company_name) : str(body.companyName);
    if (!companyName) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    const email = body.email === undefined ? str(existing.email) : str(body.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await db
      .prepare(
        `UPDATE clients
            SET company_name = ?, contact_name = ?, email = ?, phone = ?,
                industry = ?, country = ?, notes = ?, status = ?
          WHERE id = ?`
      )
      .run(
        companyName,
        body.contactName === undefined ? str(existing.contact_name) : str(body.contactName),
        email.toLowerCase(),
        body.phone === undefined ? str(existing.phone) : str(body.phone),
        body.industry === undefined ? str(existing.industry) : str(body.industry),
        body.country === undefined ? str(existing.country) : str(body.country),
        body.notes === undefined ? str(existing.notes) : str(body.notes),
        body.status === undefined ? str(existing.status, "lead") : oneOf(body.status, CLIENT_STATUSES, "lead"),
        id
      );

    const client = await db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
    return NextResponse.json({ client });
  } catch (err) {
    return serverError("clients/[id] PATCH", err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const client = await db.prepare("SELECT id FROM clients WHERE id = ?").get(id);
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

    // Projects reference the client — refuse rather than orphan them.
    const projects = (await db.prepare("SELECT COUNT(*) AS c FROM projects WHERE client_id = ?").get(id)) as {
      c: number;
    };
    if (num(projects?.c) > 0) {
      return NextResponse.json(
        {
          error: `This client still has ${num(projects.c)} project(s). Archive the client instead, or delete its projects first.`,
        },
        { status: 409 }
      );
    }

    await db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("clients/[id] DELETE", err);
  }
}
