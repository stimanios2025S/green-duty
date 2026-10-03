import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { findOwnedProject, parseSpecRow, serializeInvoice, str } from "@/lib/agency";

/**
 * GET /api/portal/projects/:id
 *
 * One project, as its own client sees it.
 *
 * Ownership is decided by a JOIN on the caller's own client record, so a
 * guessed project id returns 404. Internal fields — `owner_note` on
 * milestones, the owner's notes, and other clients' data — are never selected
 * here in the first place.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const { id } = await params;
    const db = await getDb();

    const user = (await db.prepare("SELECT id, email FROM users WHERE id = ?").get(session.userId)) as
      | { id: string; email: string }
      | undefined;
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const owned = await findOwnedProject(db, id, user.email);
    if (!owned) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    // Only the fields a client should see. No internal amounts, no owner notes.
    const project = {
      id: str(owned.id),
      title: str(owned.title),
      category: str(owned.category),
      description: str(owned.description),
      status: str(owned.status),
      progress: Number(owned.progress || 0),
      start_date: str(owned.start_date),
      due_date: str(owned.due_date),
      currency: str(owned.currency, "DZD"),
      total_amount: Number(owned.total_amount || 0),
      delivery_target: str(owned.delivery_target),
      created_at: str(owned.created_at),
    };

    const rawSpec = (await db
      .prepare("SELECT * FROM project_specs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(id)) as Record<string, unknown> | undefined;

    const invoices = (await db
      .prepare("SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC")
      .all(id)) as Record<string, unknown>[];

    const payments = (await db
      .prepare(
        `SELECT pay.id, pay.amount, pay.method, pay.reference, pay.received_at, i.invoice_number
           FROM payments pay
           LEFT JOIN invoices i ON i.id = pay.invoice_id
          WHERE pay.project_id = ?
          ORDER BY pay.received_at DESC`
      )
      .all(id)) as Record<string, unknown>[];

    // The client order this project came from, for the design style they chose.
    const order = (await db
      .prepare("SELECT offering_name, design_style, budget_range FROM project_orders WHERE project_id = ? LIMIT 1")
      .get(id)) as { offering_name: string | null; design_style: string | null; budget_range: string | null } | undefined;

    return NextResponse.json({
      project,
      spec: rawSpec ? parseSpecRow(rawSpec) : null,
      // Drafts are not the client's business until they are issued.
      invoices: invoices.map(serializeInvoice).filter(inv => inv.status !== "draft"),
      payments,
      designStyle: order?.design_style || null,
      offeringName: order?.offering_name || null,
    });
  } catch (err) {
    console.error("[portal/projects/[id]]", err);
    return NextResponse.json({ error: "Failed to load that project." }, { status: 500 });
  }
}
