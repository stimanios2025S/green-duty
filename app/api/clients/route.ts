import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { CLIENT_STATUSES, genId, num, oneOf, str } from "@/lib/agency";

/**
 * GET  /api/clients?userId=…&search=…&status=…  → list, with per-client totals
 * POST /api/clients                            → create
 *
 * Owner-only.
 */

export async function GET(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = str(searchParams.get("search"));
    const status = str(searchParams.get("status"));

    const where: string[] = [];
    const args: unknown[] = [];

    if (search) {
      where.push(
        `(c.company_name LIKE ? OR c.contact_name LIKE ? OR c.email LIKE ?
          OR c.industry LIKE ? OR c.country LIKE ?)`
      );
      const like = `%${search}%`;
      args.push(like, like, like, like, like);
    }
    if (status && (CLIENT_STATUSES as readonly string[]).includes(status)) {
      where.push("c.status = ?");
      args.push(status);
    }

    const db = await getDb();
    const sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS project_count,
             (SELECT COALESCE(SUM(p.total_amount), 0) FROM projects p WHERE p.client_id = c.id) AS project_value,
             (SELECT COALESCE(SUM(pay.amount), 0)
                FROM payments pay
                JOIN projects p ON p.id = pay.project_id
               WHERE p.client_id = c.id) AS total_paid
        FROM clients c
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY c.created_at DESC`;

    const clients = (await db.prepare(sql).all(...args)) as Record<string, unknown>[];

    return NextResponse.json({
      clients: clients.map(c => ({
        ...c,
        project_count: num(c.project_count),
        project_value: num(c.project_value),
        total_paid: num(c.total_paid),
      })),
    });
  } catch (err) {
    return serverError("clients GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const companyName = str(body.companyName);
    if (!companyName) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }
    if (companyName.length > 200) {
      return NextResponse.json({ error: "Company name is too long." }, { status: 400 });
    }

    const email = str(body.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const id = genId("cl");
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO clients
           (id, company_name, contact_name, email, phone, industry, country, notes, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        companyName,
        str(body.contactName),
        email.toLowerCase(),
        str(body.phone),
        str(body.industry),
        str(body.country),
        str(body.notes),
        oneOf(body.status, CLIENT_STATUSES, "lead"),
        new Date().toISOString()
      );

    const client = await db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    return serverError("clients POST", err);
  }
}
