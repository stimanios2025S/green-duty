import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isOwnerEmail, requireOwner, serverError } from "@/lib/owner-auth";
import {
  DESIGN_REFERENCE_STATUSES,
  findOwnedProject,
  genId,
  isSafeReferenceUrl,
  oneOf,
  str,
} from "@/lib/agency";

/**
 * Design references — a client pastes a link to a design they like, plus notes
 * on what appeals to them. We design something original inspired by it.
 *
 * ── HARD RULES — DO NOT REVERSE THESE ─────────────────────────────────────
 * 1. We store the URL *string* and nothing else. The referenced page or image
 *    is NEVER fetched, downloaded, proxied, screenshotted or cached anywhere
 *    in this system. Do not add an image proxy for it.
 * 2. It is NEVER rendered in an <iframe>. It is rendered as an outbound link
 *    only, with target="_blank" rel="noopener noreferrer".
 * 3. Only absolute `https:` URLs are accepted. `javascript:`, `data:`,
 *    relative paths and plain `http:` are rejected by `isSafeReferenceUrl`.
 *
 * The reason is legal as well as technical: the designs belong to individual
 * designers, and copying their work into our product — or re-serving it to a
 * client as a deliverable — is not ours to do. Referencing it is.
 * ──────────────────────────────────────────────────────────────────────────
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

    if (!isOwnerEmail(user.email)) {
      const owned = await findOwnedProject(db, projectId, user.email);
      if (!owned) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const rows = (await db
      .prepare("SELECT * FROM design_references WHERE project_id = ? ORDER BY created_at DESC")
      .all(projectId)) as Record<string, unknown>[];

    // A client sees the status and their own notes — never the owner's.
    const references = isOwnerEmail(user.email)
      ? rows
      : rows.map(row => {
          const { owner_notes, ...rest } = row;
          void owner_notes;
          return rest;
        });

    return NextResponse.json({ references });
  } catch (err) {
    return serverError("design-references GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const projectId = str(body.projectId);
    const referenceUrl = str(body.referenceUrl);

    if (!projectId) return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    if (!isSafeReferenceUrl(referenceUrl)) {
      return NextResponse.json(
        { error: "Please paste a full link starting with https:// — other link types aren't accepted." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = (await db.prepare("SELECT id, email FROM users WHERE id = ?").get(session.userId)) as
      | { id: string; email: string }
      | undefined;
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    // The owner may add to any project; a client only to their own.
    if (!isOwnerEmail(user.email)) {
      const owned = await findOwnedProject(db, projectId, user.email);
      if (!owned) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const id = genId("dref");
    await db
      .prepare(
        `INSERT INTO design_references
           (id, project_id, title, reference_url, client_notes, owner_notes, status, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, '', 'suggested', ?, ?)`
      )
      .run(
        id,
        projectId,
        str(body.title),
        referenceUrl,
        str(body.clientNotes),
        // Who added it — lets a client remove their own later without being
        // able to touch anyone else's.
        user.id,
        new Date().toISOString()
      );

    const reference = await db.prepare("SELECT * FROM design_references WHERE id = ?").get(id);
    return NextResponse.json({ reference }, { status: 201 });
  } catch (err) {
    return serverError("design-references POST", err);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const id = str(body.id);
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const db = await getDb();
    const existing = (await db.prepare("SELECT * FROM design_references WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Reference not found." }, { status: 404 });

    const status =
      body.status === undefined
        ? str(existing.status, "suggested")
        : oneOf(
            body.status,
            DESIGN_REFERENCE_STATUSES,
            str(existing.status, "suggested") as (typeof DESIGN_REFERENCE_STATUSES)[number]
          );

    await db
      .prepare("UPDATE design_references SET status = ?, owner_notes = ?, title = ? WHERE id = ?")
      .run(
        status,
        body.ownerNotes === undefined ? str(existing.owner_notes) : str(body.ownerNotes),
        body.title === undefined ? str(existing.title) : str(body.title),
        id
      );

    const reference = await db.prepare("SELECT * FROM design_references WHERE id = ?").get(id);
    return NextResponse.json({ reference });
  } catch (err) {
    return serverError("design-references PATCH", err);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = str(body.id);
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const db = await getDb();
    const user = (await db.prepare("SELECT id, email FROM users WHERE id = ?").get(session.userId)) as
      | { id: string; email: string }
      | undefined;
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    if (isOwnerEmail(user.email)) {
      const existing = await db.prepare("SELECT id FROM design_references WHERE id = ?").get(id);
      if (!existing) return NextResponse.json({ error: "Reference not found." }, { status: 404 });
      await db.prepare("DELETE FROM design_references WHERE id = ?").run(id);
      return NextResponse.json({ ok: true });
    }

    // A client may remove a reference they added themselves, on a project that
    // is theirs. Both conditions are in the DELETE itself, so a guessed id
    // simply deletes nothing — there is no separate check to get out of step
    // with the write.
    const result = await db
      .prepare(
        `DELETE FROM design_references
          WHERE id = ?
            AND created_by = ?
            AND project_id IN (
              SELECT p.id
                FROM projects p
                JOIN clients c ON c.id = p.client_id
               WHERE LOWER(c.email) = ?
            )`
      )
      .run(id, user.id, str(user.email).toLowerCase());

    if (Number(result.changes) === 0) {
      // Same answer whether it does not exist, is not theirs, or was added by
      // the owner — no probing for which.
      return NextResponse.json({ error: "Reference not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("design-references DELETE", err);
  }
}
