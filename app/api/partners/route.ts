import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { genId, oneOf, PARTNER_CATEGORIES, PARTNER_STATUSES, str } from "@/lib/agency";

/**
 * GET  /api/partners?userId=…&search=…&category=…&status=…
 * POST /api/partners
 *
 * Owner-only.
 */

export async function GET(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = str(searchParams.get("search"));
    const category = str(searchParams.get("category"));
    const status = str(searchParams.get("status"));

    const where: string[] = [];
    const args: unknown[] = [];

    if (search) {
      where.push("(name LIKE ? OR description LIKE ? OR contact_name LIKE ? OR email LIKE ?)");
      const like = `%${search}%`;
      args.push(like, like, like, like);
    }
    if (category && (PARTNER_CATEGORIES as readonly string[]).includes(category)) {
      where.push("category = ?");
      args.push(category);
    }
    if (status && (PARTNER_STATUSES as readonly string[]).includes(status)) {
      where.push("status = ?");
      args.push(status);
    }

    const db = await getDb();
    const partners = (await db
      .prepare(
        `SELECT * FROM partners
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
         ORDER BY created_at DESC`
      )
      .all(...args)) as Record<string, unknown>[];

    return NextResponse.json({ partners });
  } catch (err) {
    return serverError("partners GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const name = str(body.name);
    if (!name) return NextResponse.json({ error: "Partner name is required." }, { status: 400 });

    const email = str(body.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const id = genId("ptn");
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO partners
           (id, name, logo_url, category, website, contact_name, email,
            collaboration_type, description, status, since, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        name,
        str(body.logoUrl),
        oneOf(body.category, PARTNER_CATEGORIES, "technology"),
        str(body.website),
        str(body.contactName),
        email.toLowerCase(),
        str(body.collaborationType),
        str(body.description),
        oneOf(body.status, PARTNER_STATUSES, "active"),
        str(body.since),
        new Date().toISOString()
      );

    const partner = await db.prepare("SELECT * FROM partners WHERE id = ?").get(id);
    return NextResponse.json({ partner }, { status: 201 });
  } catch (err) {
    return serverError("partners POST", err);
  }
}
