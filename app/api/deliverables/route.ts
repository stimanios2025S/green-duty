import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { DELIVERABLE_STATUSES, DELIVERABLE_TYPES, genId, num, oneOf, str } from "@/lib/agency";

/**
 * POST /api/deliverables — owner only.
 *
 * Deliverables are owner-managed here. The client's *choice* of delivery
 * target is Part 6 and is not built yet.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const milestoneId = str(body.milestoneId);
    const title = str(body.title);
    if (!milestoneId || !title) {
      return NextResponse.json({ error: "A deliverable needs a milestone and a title." }, { status: 400 });
    }

    const db = await getDb();
    const milestone = (await db
      .prepare("SELECT id, project_id FROM project_milestones WHERE id = ?")
      .get(milestoneId)) as { id: string; project_id: string } | undefined;
    if (!milestone) return NextResponse.json({ error: "Milestone not found." }, { status: 404 });

    const id = genId("dlv");
    await db
      .prepare(
        `INSERT INTO project_deliverables
           (id, milestone_id, project_id, title, type, description, status, due_date, completed_at, amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
      )
      .run(
        id,
        milestoneId,
        milestone.project_id,
        title,
        oneOf(body.type, DELIVERABLE_TYPES, "document"),
        str(body.description),
        oneOf(body.status, DELIVERABLE_STATUSES, "pending"),
        str(body.dueDate),
        Math.max(0, num(body.amount)),
        new Date().toISOString()
      );

    const deliverable = await db.prepare("SELECT * FROM project_deliverables WHERE id = ?").get(id);
    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (err) {
    return serverError("deliverables POST", err);
  }
}
