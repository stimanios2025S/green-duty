import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isOwnerEmail, requireOwner, serverError } from "@/lib/owner-auth";
import { genId, oneOf, ORDER_STATUSES, parseSpecRow, STARTER_ROADMAP, str } from "@/lib/agency";

/**
 * GET   /api/project-orders/:id — owner reads any order; a client reads only their own
 * PATCH /api/project-orders/:id — owner only (status transitions, internal notes)
 *
 * Identity comes from the signed session cookie. A client's access is scoped
 * in SQL to their own client record, so a guessed order id returns nothing —
 * the check is not performed in the UI.
 */

/** Shared projection so both branches return the same shape. */
const SELECT_ORDER = `
  SELECT o.*, c.company_name AS client_company, c.contact_name AS client_contact,
         c.email AS client_email, c.phone AS client_phone
    FROM project_orders o
    LEFT JOIN clients c ON c.id = o.client_id`;

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

    const owner = isOwnerEmail(user.email);

    // A client's query is constrained to their own client row. A guessed id
    // simply matches nothing.
    const order = owner
      ? await db.prepare(`${SELECT_ORDER} WHERE o.id = ?`).get(id)
      : await db
          .prepare(
            `${SELECT_ORDER}
               JOIN clients cc ON cc.id = o.client_id
              WHERE o.id = ? AND LOWER(cc.email) = ?`
          )
          .get(id, str(user.email).toLowerCase());

    // Same response whether it does not exist or is not theirs — no probing.
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const spec = (await db
      .prepare("SELECT * FROM project_specs WHERE order_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(id)) as Record<string, unknown> | undefined;

    const payload = {
      order,
      spec: spec ? parseSpecRow(spec) : null,
      // The owner sees internal notes; the client never does.
      isOwner: owner,
    };

    if (!owner && payload.order && typeof payload.order === "object") {
      const { owner_notes, ...clientSafe } = payload.order as Record<string, unknown>;
      void owner_notes;
      return NextResponse.json({ ...payload, order: clientSafe });
    }

    return NextResponse.json(payload);
  } catch (err) {
    return serverError("project-orders/[id] GET", err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const db = await getDb();

    const existing = (await db.prepare("SELECT * FROM project_orders WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    // Status must be one of the fixed set — never an arbitrary string from the body.
    const status =
      body.status === undefined
        ? str(existing.status, "draft")
        : oneOf(body.status, ORDER_STATUSES, str(existing.status, "draft") as (typeof ORDER_STATUSES)[number]);

    const ownerNotes = body.ownerNotes === undefined ? str(existing.owner_notes) : str(body.ownerNotes);

    // Approving is the one transition with side effects: it creates the
    // project and seeds the roadmap.
    let projectId = str(existing.project_id);
    if (status === "approved") {
      projectId = await approveOrderToProject(db, id, existing);
    }

    await db
      .prepare("UPDATE project_orders SET status = ?, owner_notes = ?, project_id = ?, updated_at = ? WHERE id = ?")
      .run(status, ownerNotes, projectId || null, new Date().toISOString(), id);

    const order = await db.prepare("SELECT * FROM project_orders WHERE id = ?").get(id);
    return NextResponse.json({ order, projectId: projectId || null });
  } catch (err) {
    return serverError("project-orders/[id] PATCH", err);
  }
}

/**
 * Approve an order: create its project, link the spec, seed the starter
 * roadmap, and remember the project on the order.
 *
 * Idempotent — approving twice returns the project created the first time
 * rather than creating a second one. Works for orders with no spec (the
 * direct-contact paths): the spec section is simply left empty.
 */
async function approveOrderToProject(
  db: Db,
  orderId: string,
  order: Record<string, unknown>
): Promise<string> {
  // Already approved and linked? Hand back what exists.
  const already = str(order.project_id);
  if (already) return already;

  // Belt and braces: a spec already pointing at a project means approval ran.
  const linked = (await db
    .prepare("SELECT project_id FROM project_specs WHERE order_id = ? AND project_id IS NOT NULL LIMIT 1")
    .get(orderId)) as { project_id: string } | undefined;
  if (linked?.project_id) return str(linked.project_id);

  const spec = (await db
    .prepare("SELECT * FROM project_specs WHERE order_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(orderId)) as Record<string, unknown> | undefined;

  const now = new Date().toISOString();
  const projectId = genId("prj");

  // Title: the client's own project name, else the offering they ordered.
  const title = str(spec?.project_name) || str(order.offering_name) || "New project";

  await db
    .prepare(
      `INSERT INTO projects
         (id, client_id, title, category, description, status, total_amount, currency,
          deposit_amount, start_date, due_date, progress, delivery_target, created_at)
       VALUES (?, ?, ?, ?, ?, 'in_progress', 0, ?, 0, ?, '', 0, '', ?)`
    )
    .run(
      projectId,
      str(order.client_id) || null,
      title,
      str(order.category, "other"),
      str(spec?.full_summary),
      str(order.currency, "DZD") || "DZD",
      now.slice(0, 10),
      now
    );

  if (spec) {
    await db
      .prepare(
        `UPDATE project_specs
            SET project_id = ?, status = 'confirmed', confirmed_at = COALESCE(confirmed_at, ?)
          WHERE id = ?`
      )
      .run(projectId, now, str(spec.id));
  }

  // Starter roadmap so the client sees structure immediately. No fabricated
  // dates — due_date stays empty until the owner sets it.
  for (let i = 0; i < STARTER_ROADMAP.length; i++) {
    const step = STARTER_ROADMAP[i];
    await db
      .prepare(
        `INSERT INTO project_milestones
           (id, project_id, title, description, phase, order_index, status, due_date, progress,
            owner_note, client_visible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', '', 0, '', 1, ?, ?)`
      )
      .run(genId("ms"), projectId, step.title, step.description, step.phase, i, now, now);
  }

  return projectId;
}
