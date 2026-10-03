import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isOwnerEmail, requireOwner, serverError } from "@/lib/owner-auth";
import {
  clamp,
  findOwnedProject,
  genId,
  int,
  MILESTONE_PHASES,
  MILESTONE_STATUSES,
  oneOf,
  str,
} from "@/lib/agency";

/**
 * GET   /api/milestones?projectId=… — owner: all; client: client-visible only, own project
 * POST  /api/milestones             — owner only
 * PATCH /api/milestones             — owner only, persist a reorder
 *
 * Identity comes from the signed session cookie. A client's access is decided
 * by a JOIN on their own client record, so a guessed project id matches
 * nothing — the check is in SQL, not the UI.
 */

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = str(searchParams.get("projectId"));
    if (!projectId) return NextResponse.json({ error: "Missing projectId." }, { status: 400 });

    const db = await getDb();
    const user = (await db.prepare("SELECT id, email FROM users WHERE id = ?").get(session.userId)) as
      | { id: string; email: string }
      | undefined;
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const owner = isOwnerEmail(user.email);

    if (!owner) {
      const owned = await findOwnedProject(db, projectId, user.email);
      if (!owned) return NextResponse.json({ error: "Project not found." }, { status: 404 });

      const milestones = (await db
        .prepare(
          `SELECT * FROM project_milestones
            WHERE project_id = ? AND client_visible = 1
            ORDER BY order_index ASC`
        )
        .all(projectId)) as Record<string, unknown>[];

      // Deliverables belong to a visible milestone, or they are not shown.
      const deliverables = (await db
        .prepare(
          `SELECT d.* FROM project_deliverables d
             JOIN project_milestones m ON m.id = d.milestone_id
            WHERE d.project_id = ? AND m.client_visible = 1
            ORDER BY d.created_at ASC`
        )
        .all(projectId)) as Record<string, unknown>[];

      // `owner_note` is internal and never leaves the server for a client.
      const strip = (rows: Record<string, unknown>[]) =>
        rows.map(row => {
          const { owner_note, ...rest } = row;
          void owner_note;
          return rest;
        });

      return NextResponse.json({ milestones: strip(milestones), deliverables: strip(deliverables) });
    }

    const milestones = (await db
      .prepare("SELECT * FROM project_milestones WHERE project_id = ? ORDER BY order_index ASC")
      .all(projectId)) as Record<string, unknown>[];
    const deliverables = (await db
      .prepare("SELECT * FROM project_deliverables WHERE project_id = ? ORDER BY created_at ASC")
      .all(projectId)) as Record<string, unknown>[];

    return NextResponse.json({ milestones, deliverables });
  } catch (err) {
    return serverError("milestones GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const projectId = str(body.projectId);
    if (!projectId) return NextResponse.json({ error: "Missing projectId." }, { status: 400 });

    const title = str(body.title);
    if (!title) return NextResponse.json({ error: "A milestone needs a title." }, { status: 400 });

    const db = await getDb();
    const existing = await db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
    if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const last = (await db
      .prepare("SELECT MAX(order_index) AS m FROM project_milestones WHERE project_id = ?")
      .get(projectId)) as { m: number | null } | undefined;

    const now = new Date().toISOString();
    const id = genId("ms");

    await db
      .prepare(
        `INSERT INTO project_milestones
           (id, project_id, title, description, phase, order_index, status, due_date, progress,
            owner_note, client_visible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        projectId,
        title,
        str(body.description),
        oneOf(body.phase, MILESTONE_PHASES, "discovery"),
        int(last?.m, -1) + 1,
        oneOf(body.status, MILESTONE_STATUSES, "pending"),
        str(body.dueDate),
        clamp(int(body.progress), 0, 100),
        str(body.ownerNote),
        body.clientVisible === false ? 0 : 1,
        now,
        now
      );

    const milestone = await db.prepare("SELECT * FROM project_milestones WHERE id = ?").get(id);
    return NextResponse.json({ milestone }, { status: 201 });
  } catch (err) {
    return serverError("milestones POST", err);
  }
}

/** Persist a reorder: the array index becomes `order_index`. */
export async function PATCH(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const order = Array.isArray(body.order) ? body.order.map((v: unknown) => str(v)).filter(Boolean) : null;
    if (!order || order.length === 0) {
      return NextResponse.json({ error: "Expected an ordered list of milestone ids." }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    for (let i = 0; i < order.length; i++) {
      await db
        .prepare("UPDATE project_milestones SET order_index = ?, updated_at = ? WHERE id = ?")
        .run(i, now, order[i]);
    }

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    return serverError("milestones PATCH", err);
  }
}
