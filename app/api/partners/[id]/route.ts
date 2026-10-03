import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { oneOf, PARTNER_CATEGORIES, PARTNER_STATUSES, str } from "@/lib/agency";

/**
 * GET / PATCH / DELETE /api/partners/:id
 *
 * Owner-only.
 */

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { id } = await params;
    const db = await getDb();
    const partner = await db.prepare("SELECT * FROM partners WHERE id = ?").get(id);
    if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

    return NextResponse.json({ partner });
  } catch (err) {
    return serverError("partners/[id] GET", err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const existing = (await db.prepare("SELECT * FROM partners WHERE id = ?").get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!existing) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

    const name = body.name === undefined ? str(existing.name) : str(body.name);
    if (!name) return NextResponse.json({ error: "Partner name is required." }, { status: 400 });

    const email = body.email === undefined ? str(existing.email) : str(body.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await db
      .prepare(
        `UPDATE partners
            SET name = ?, logo_url = ?, category = ?, website = ?, contact_name = ?,
                email = ?, collaboration_type = ?, description = ?, status = ?, since = ?
          WHERE id = ?`
      )
      .run(
        name,
        body.logoUrl === undefined ? str(existing.logo_url) : str(body.logoUrl),
        body.category === undefined
          ? str(existing.category, "technology")
          : oneOf(body.category, PARTNER_CATEGORIES, "technology"),
        body.website === undefined ? str(existing.website) : str(body.website),
        body.contactName === undefined ? str(existing.contact_name) : str(body.contactName),
        email.toLowerCase(),
        body.collaborationType === undefined ? str(existing.collaboration_type) : str(body.collaborationType),
        body.description === undefined ? str(existing.description) : str(body.description),
        body.status === undefined ? str(existing.status, "active") : oneOf(body.status, PARTNER_STATUSES, "active"),
        body.since === undefined ? str(existing.since) : str(body.since),
        id
      );

    const partner = await db.prepare("SELECT * FROM partners WHERE id = ?").get(id);
    return NextResponse.json({ partner });
  } catch (err) {
    return serverError("partners/[id] PATCH", err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const partner = await db.prepare("SELECT id FROM partners WHERE id = ?").get(id);
    if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

    await db.prepare("DELETE FROM partners WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("partners/[id] DELETE", err);
  }
}
