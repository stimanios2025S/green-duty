import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import {
  clamp,
  int,
  num,
  oneOf,
  parseSpecRow,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  serializeInvoice,
  str,
} from "@/lib/agency";

/**
 * GET    /api/projects/:id?userId=…  → project + client + invoices + payments
 * PATCH  /api/projects/:id           → update (status, progress, amounts, …)
 * DELETE /api/projects/:id           → delete, only when it has no invoices
 *
 * Owner-only.
 */

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const db = await getDb();

    const project = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const client = project.client_id
      ? ((await db.prepare("SELECT * FROM clients WHERE id = ?").get(project.client_id)) as
          | Record<string, unknown>
          | undefined)
      : undefined;

    const invoices = (await db
      .prepare("SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC")
      .all(id)) as Record<string, unknown>[];

    const payments = (await db
      .prepare(
        `SELECT pay.*, i.invoice_number
           FROM payments pay
           LEFT JOIN invoices i ON i.id = pay.invoice_id
          WHERE pay.project_id = ?
          ORDER BY pay.received_at DESC, pay.created_at DESC`
      )
      .all(id)) as Record<string, unknown>[];

    // The specification this project was built from, if one was written.
    const rawSpec = (await db
      .prepare("SELECT * FROM project_specs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(id)) as Record<string, unknown> | undefined;
    const spec = rawSpec ? parseSpecRow(rawSpec) : null;

    // The style the client picked when they ordered, so the owner sees the
    // starting direction next to any specific references they added.
    const order = (await db
      .prepare("SELECT offering_name, design_style, budget_range FROM project_orders WHERE project_id = ? LIMIT 1")
      .get(id)) as { offering_name: string | null; design_style: string | null } | undefined;

    return NextResponse.json({
      project: { ...project, paid: payments.reduce((s, p) => s + num(p.amount), 0) },
      client: client ?? null,
      invoices: invoices.map(serializeInvoice),
      payments,
      spec,
      designStyle: order?.design_style || null,
      offeringName: order?.offering_name || null,
    });
  } catch (err) {
    return serverError("projects/[id] GET", err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const existing = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const title = body.title === undefined ? str(existing.title) : str(body.title);
    if (!title) return NextResponse.json({ error: "Project title is required." }, { status: 400 });

    let clientId = body.clientId === undefined ? str(existing.client_id) : str(body.clientId);
    if (clientId) {
      const client = await db.prepare("SELECT id FROM clients WHERE id = ?").get(clientId);
      if (!client) return NextResponse.json({ error: "That client no longer exists." }, { status: 400 });
    } else {
      clientId = "";
    }

    await db
      .prepare(
        `UPDATE projects
            SET client_id = ?, title = ?, category = ?, description = ?, status = ?,
                total_amount = ?, currency = ?, deposit_amount = ?, start_date = ?,
                due_date = ?, progress = ?
          WHERE id = ?`
      )
      .run(
        clientId || null,
        title,
        body.category === undefined ? str(existing.category, "other") : oneOf(body.category, PROJECT_CATEGORIES, "other"),
        body.description === undefined ? str(existing.description) : str(body.description),
        body.status === undefined ? str(existing.status, "lead") : oneOf(body.status, PROJECT_STATUSES, "lead"),
        body.totalAmount === undefined ? num(existing.total_amount) : Math.max(0, num(body.totalAmount)),
        body.currency === undefined ? str(existing.currency, "DZD") : str(body.currency, "DZD") || "DZD",
        body.depositAmount === undefined ? num(existing.deposit_amount) : Math.max(0, num(body.depositAmount)),
        body.startDate === undefined ? str(existing.start_date) : str(body.startDate),
        body.dueDate === undefined ? str(existing.due_date) : str(body.dueDate),
        body.progress === undefined ? int(existing.progress) : clamp(int(body.progress), 0, 100),
        id
      );

    const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    return NextResponse.json({ project });
  } catch (err) {
    return serverError("projects/[id] PATCH", err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const project = await db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    // Invoices and payments reference the project — refuse rather than orphan them.
    const invoices = (await db.prepare("SELECT COUNT(*) AS c FROM invoices WHERE project_id = ?").get(id)) as {
      c: number;
    };
    if (num(invoices?.c) > 0) {
      return NextResponse.json(
        { error: `This project has ${num(invoices.c)} invoice(s). Delete those first, or set the project to cancelled.` },
        { status: 409 }
      );
    }

    const payments = (await db.prepare("SELECT COUNT(*) AS c FROM payments WHERE project_id = ?").get(id)) as {
      c: number;
    };
    if (num(payments?.c) > 0) {
      return NextResponse.json(
        { error: `This project has ${num(payments.c)} recorded payment(s). Remove those first.` },
        { status: 409 }
      );
    }

    await db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("projects/[id] DELETE", err);
  }
}
