import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { DELIVERABLE_STATUSES, DELIVERABLE_TYPES, num, oneOf, str } from "@/lib/agency";

/**
 * PATCH  /api/deliverables/:id — owner only
 * DELETE /api/deliverables/:id — owner only
 */

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const db = await getDb();

    const existing = (await db.prepare("SELECT * FROM project_deliverables WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Deliverable not found." }, { status: 404 });

    const title = body.title === undefined ? str(existing.title) : str(body.title);
    if (!title) return NextResponse.json({ error: "A deliverable needs a title." }, { status: 400 });

    const status =
      body.status === undefined
        ? str(existing.status, "pending")
        : oneOf(
            body.status,
            DELIVERABLE_STATUSES,
            str(existing.status, "pending") as (typeof DELIVERABLE_STATUSES)[number]
          );

    // Stamp the completion time the first time it is marked completed.
    const completedAt =
      status === "completed" && !str(existing.completed_at) ? new Date().toISOString() : str(existing.completed_at);

    await db
      .prepare(
        `UPDATE project_deliverables
            SET title = ?, type = ?, description = ?, status = ?, due_date = ?, completed_at = ?, amount = ?
          WHERE id = ?`
      )
      .run(
        title,
        body.type === undefined
          ? str(existing.type, "document")
          : oneOf(body.type, DELIVERABLE_TYPES, str(existing.type, "document") as (typeof DELIVERABLE_TYPES)[number]),
        body.description === undefined ? str(existing.description) : str(body.description),
        status,
        body.dueDate === undefined ? str(existing.due_date) : str(body.dueDate),
        completedAt,
        body.amount === undefined ? num(existing.amount) : Math.max(0, num(body.amount)),
        id
      );

    const deliverable = await db.prepare("SELECT * FROM project_deliverables WHERE id = ?").get(id);
    return NextResponse.json({ deliverable });
  } catch (err) {
    return serverError("deliverables/[id] PATCH", err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const db = await getDb();

    const existing = await db.prepare("SELECT id FROM project_deliverables WHERE id = ?").get(id);
    if (!existing) return NextResponse.json({ error: "Deliverable not found." }, { status: 404 });

    await db.prepare("DELETE FROM project_deliverables WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("deliverables/[id] DELETE", err);
  }
}
