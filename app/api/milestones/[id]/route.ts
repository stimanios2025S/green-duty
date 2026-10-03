import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { clamp, int, MILESTONE_PHASES, MILESTONE_STATUSES, oneOf, str } from "@/lib/agency";

/**
 * PATCH  /api/milestones/:id — owner only
 * DELETE /api/milestones/:id — owner only; removes the milestone's deliverables too
 */

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const db = await getDb();

    const existing = (await db.prepare("SELECT * FROM project_milestones WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Milestone not found." }, { status: 404 });

    const title = body.title === undefined ? str(existing.title) : str(body.title);
    if (!title) return NextResponse.json({ error: "A milestone needs a title." }, { status: 400 });

    // Fixed sets only — never an arbitrary string from the request.
    const phase =
      body.phase === undefined
        ? str(existing.phase, "discovery")
        : oneOf(body.phase, MILESTONE_PHASES, str(existing.phase, "discovery") as (typeof MILESTONE_PHASES)[number]);

    const status =
      body.status === undefined
        ? str(existing.status, "pending")
        : oneOf(
            body.status,
            MILESTONE_STATUSES,
            str(existing.status, "pending") as (typeof MILESTONE_STATUSES)[number]
          );

    await db
      .prepare(
        `UPDATE project_milestones
            SET title = ?, description = ?, phase = ?, status = ?, due_date = ?,
                progress = ?, owner_note = ?, client_visible = ?, updated_at = ?
          WHERE id = ?`
      )
      .run(
        title,
        body.description === undefined ? str(existing.description) : str(body.description),
        phase,
        status,
        body.dueDate === undefined ? str(existing.due_date) : str(body.dueDate),
        body.progress === undefined ? int(existing.progress) : clamp(int(body.progress), 0, 100),
        body.ownerNote === undefined ? str(existing.owner_note) : str(body.ownerNote),
        body.clientVisible === undefined ? int(existing.client_visible, 1) : body.clientVisible ? 1 : 0,
        new Date().toISOString(),
        id
      );

    const milestone = await db.prepare("SELECT * FROM project_milestones WHERE id = ?").get(id);
    return NextResponse.json({ milestone });
  } catch (err) {
    return serverError("milestones/[id] PATCH", err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const db = await getDb();

    const existing = await db.prepare("SELECT id FROM project_milestones WHERE id = ?").get(id);
    if (!existing) return NextResponse.json({ error: "Milestone not found." }, { status: 404 });

    // Deliverables hang off the milestone; leaving them would orphan rows.
    await db.prepare("DELETE FROM project_deliverables WHERE milestone_id = ?").run(id);
    await db.prepare("DELETE FROM project_milestones WHERE id = ?").run(id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("milestones/[id] DELETE", err);
  }
}
