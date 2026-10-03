import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import {
  clamp,
  genId,
  int,
  num,
  oneOf,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  str,
} from "@/lib/agency";

/**
 * GET  /api/projects?userId=…&search=…&category=…&status=…
 * POST /api/projects
 *
 * Owner-only. `clientId` is optional — an internal project has no client —
 * but when it is supplied it must reference a real client.
 */

export async function GET(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = str(searchParams.get("search"));
    const category = str(searchParams.get("category"));
    const status = str(searchParams.get("status"));
    const clientId = str(searchParams.get("clientId"));

    const where: string[] = [];
    const args: unknown[] = [];

    if (search) {
      where.push("(p.title LIKE ? OR p.description LIKE ? OR c.company_name LIKE ?)");
      const like = `%${search}%`;
      args.push(like, like, like);
    }
    if (category && (PROJECT_CATEGORIES as readonly string[]).includes(category)) {
      where.push("p.category = ?");
      args.push(category);
    }
    if (status && (PROJECT_STATUSES as readonly string[]).includes(status)) {
      where.push("p.status = ?");
      args.push(status);
    }
    if (clientId) {
      where.push("p.client_id = ?");
      args.push(clientId);
    }

    const db = await getDb();
    const projects = (await db
      .prepare(
        `SELECT p.*, c.company_name AS client_name,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE project_id = p.id) AS paid,
                (SELECT COUNT(*) FROM invoices WHERE project_id = p.id) AS invoice_count
           FROM projects p
           LEFT JOIN clients c ON c.id = p.client_id
           ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
          ORDER BY p.created_at DESC`
      )
      .all(...args)) as Record<string, unknown>[];

    return NextResponse.json({
      projects: projects.map(p => ({
        ...p,
        total_amount: num(p.total_amount),
        deposit_amount: num(p.deposit_amount),
        progress: int(p.progress),
        paid: num(p.paid),
        invoice_count: int(p.invoice_count),
      })),
    });
  } catch (err) {
    return serverError("projects GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const title = str(body.title);
    if (!title) return NextResponse.json({ error: "Project title is required." }, { status: 400 });

    const db = await getDb();

    const clientId = str(body.clientId);
    if (clientId) {
      const client = await db.prepare("SELECT id FROM clients WHERE id = ?").get(clientId);
      if (!client) return NextResponse.json({ error: "That client no longer exists." }, { status: 400 });
    }

    const id = genId("pr");
    await db
      .prepare(
        `INSERT INTO projects
           (id, client_id, title, category, description, status, total_amount, currency,
            deposit_amount, start_date, due_date, progress, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        clientId || null,
        title,
        oneOf(body.category, PROJECT_CATEGORIES, "other"),
        str(body.description),
        oneOf(body.status, PROJECT_STATUSES, "lead"),
        Math.max(0, num(body.totalAmount)),
        str(body.currency, "DZD") || "DZD",
        Math.max(0, num(body.depositAmount)),
        str(body.startDate),
        str(body.dueDate),
        clamp(int(body.progress), 0, 100),
        new Date().toISOString()
      );

    const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return serverError("projects POST", err);
  }
}
